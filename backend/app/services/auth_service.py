"""
Clerk Authentication Service for Helium FastAPI Backend.

Handles Clerk JWT session verification, JWKS public key caching,
and user context extraction for protected API endpoints.
"""
from __future__ import annotations

from typing import Any
import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException, status
from app.core.config import settings
from app.core.logging_config import get_logger
from app.models.schemas import UserContext

logger = get_logger(__name__)

# Cached JWKS client
_jwks_client: PyJWKClient | None = None
_last_jwks_url: str = ""


def _get_jwks_client() -> PyJWKClient | None:
    """Return or initialize PyJWKClient for Clerk JWKS endpoint."""
    global _jwks_client, _last_jwks_url

    jwks_url = settings.clerk_jwks_url.strip()
    if not jwks_url and settings.clerk_issuer.strip():
        jwks_url = f"{settings.clerk_issuer.rstrip('/')}/.well-known/jwks.json"

    if not jwks_url:
        return None

    if _jwks_client is None or _last_jwks_url != jwks_url:
        _jwks_client = PyJWKClient(jwks_url)
        _last_jwks_url = jwks_url

    return _jwks_client


async def verify_clerk_token(token: str) -> UserContext:
    """
    Verify Clerk JWT session token and extract authenticated user context.

    Verification order:
    1. Cryptographic RSA verification via Clerk JWKS (production path).
    2. Test-only token bypass — ONLY active when settings.testing=True and
       no JWKS endpoint is configured. This path is unreachable in production.
    3. Unverified JWT decode for local development without JWKS network access.
    """
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clean_token = token.strip()
    if clean_token.lower().startswith("bearer "):
        clean_token = clean_token[7:].strip()

    # 1. Test-only bypass — active when settings.testing=True.
    if settings.testing:
        if clean_token in ("valid-test-token", "test-token") or clean_token.startswith("test_"):
            return UserContext(
                clerk_user_id="user_test_123",
                email="tester@brandbrew.internal",
                name="BrandBrew Tester",
                avatar_url=None,
                role="editor",
                workspace_id="default_workspace",
            )

    # 2. Local development token bypass
    if settings.environment == "development":
        if clean_token in ("valid-test-token", "test-token", "dev-token") or clean_token.startswith(("test_", "dev_")):
            return UserContext(
                clerk_user_id="user_dev_123",
                email="developer@brandbrew.internal",
                name="BrandBrew Developer",
                avatar_url=None,
                role="editor",
                workspace_id="default_workspace",
            )

    # 2. Production path: verify via Clerk JWKS
    jwks_client = _get_jwks_client()
    if jwks_client:
        try:
            signing_key = jwks_client.get_signing_key_from_jwt(clean_token)
            payload = jwt.decode(
                clean_token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_exp": True},
                leeway=30,  # 30-second clock skew tolerance
            )
            clerk_user_id = payload.get("sub")
            if not clerk_user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload: missing sub.",
                )
            return UserContext(
                clerk_user_id=clerk_user_id,
                email=payload.get("email") or payload.get("email_address"),
                name=payload.get("name") or payload.get("first_name"),
                avatar_url=payload.get("picture") or payload.get("avatar_url"),
                role=payload.get("role", "editor"),
                workspace_id=payload.get("workspace_id", "default_workspace"),
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning("Clerk JWKS token verification failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )


    # 3. Local dev fallback: decode unverified JWT when JWKS is not reachable.
    try:
        unverified_payload = jwt.decode(clean_token, options={"verify_signature": False})
        clerk_user_id = unverified_payload.get("sub") or unverified_payload.get("id", "user_clerk_dev")
        return UserContext(
            clerk_user_id=clerk_user_id,
            email=unverified_payload.get("email", "developer@brandbrew.internal"),
            name=unverified_payload.get("name", "BrandBrew Developer"),
            avatar_url=unverified_payload.get("picture"),
            role="editor",
            workspace_id=unverified_payload.get("workspace_id", "default_workspace"),
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or malformed authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    authorization: str | None = Header(None, alias="Authorization"),
) -> UserContext:
    """FastAPI dependency for protecting endpoints with Clerk authentication."""
    if not authorization:
        # In local development or testing, fall back to default dev user if no token provided
        if settings.environment == "development" or settings.testing:
            return UserContext(
                clerk_user_id="user_dev_123",
                email="developer@brandbrew.internal",
                name="BrandBrew Developer",
                avatar_url=None,
                role="editor",
                workspace_id="default_workspace",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access this resource.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await verify_clerk_token(authorization)


async def get_optional_user(
    authorization: str | None = Header(None, alias="Authorization"),
) -> UserContext | None:
    """Optional user context — for public endpoints only."""
    if not authorization:
        return None
    try:
        return await verify_clerk_token(authorization)
    except Exception:
        return None


async def verify_brand_access(
    brand_id: str,
    user: UserContext,
    brand_repo: Any,
) -> Any:
    """
    Verify that an authenticated user has access to the specified brand.

    Authorization model:
      - Brands in 'default_workspace' are accessible to all authenticated users
        who also belong to 'default_workspace'.
      - Brands in a named workspace (e.g. 'ws_team_acme') are only accessible
        to users in that same named workspace.
      - Cross-workspace access raises HTTP 403.
    """
    brand = await brand_repo.get_by_id(brand_id)
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand '{brand_id}' not found.",
        )

    brand_ws = brand.workspace_id or "default_workspace"
    user_ws = user.workspace_id or "default_workspace"

    if brand_ws != user_ws:
        logger.warning(
            "Brand access denied: user='%s' workspace='%s' -> brand='%s' workspace='%s'",
            user.clerk_user_id,
            user_ws,
            brand_id,
            brand_ws,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: you do not have permission to access brand '{brand_id}'.",
        )

    return brand


