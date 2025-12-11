
import os
import json
import urllib.request
from typing import Optional, Dict, Any
from jose import jwt
from fastapi import HTTPException, status

# Auth0 Configuration
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_API_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
ALGORITHMS = ["RS256"]

class Auth0Error(Exception):
    def __init__(self, error: str, status_code: int):
        self.error = error
        self.status_code = status_code

def get_auth0_public_key(token: str) -> str:
    """Retrieve the public key from Auth0 JWKS"""
    if not AUTH0_DOMAIN:
        raise Auth0Error("Auth0 domain not configured", 500)
    
    json_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    try:
        jwks = json.loads(urllib.request.urlopen(json_url).read())
    except Exception as e:
        raise Auth0Error(f"Failed to fetch JWKS: {str(e)}", 500)
        
    unverified_header = jwt.get_unverified_header(token)
    rsa_key = {}
    
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"]
            }
            return rsa_key
            
    raise Auth0Error("Unable to find appropriate key", 401)

def verify_auth0_token(token: str) -> Dict[str, Any]:
    """Verify the Auth0 JWT"""
    if not AUTH0_DOMAIN or not AUTH0_API_AUDIENCE:
        # If testing without keys, maybe allow skip? No, better fail safe.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Auth0 not configured on server"
        )

    try:
        rsa_key = get_auth0_public_key(token)
        
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=AUTH0_API_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTClaimsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect claims: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unable to parse authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
