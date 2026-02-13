from enum import Enum

class ViralStudioErrorCode(str, Enum):
    # Text Generation Errors
    OPENAI_AUTH_ERROR = "V101"
    OPENAI_RATE_LIMIT = "V102"
    OPENAI_INVALID_RESPONSE = "V103"
    OPENAI_QUOTA_EXCEEDED = "V104"
    
    # Gemini Fallback Errors
    GEMINI_TEXT_FAILED = "V201"
    GEMINI_AUTH_ERROR = "V202"
    
    # Image Generation Errors
    IMAGEN_AUTH_ERROR = "V301"
    IMAGEN_MODEL_NOT_FOUND = "V302"
    IMAGEN_SAFETY_BLOCKED = "V303"
    IMAGEN_TIMEOUT = "V304"
    IMAGEN_UNKNOWN_ERROR = "V305"
    
    # File & System Errors
    FS_SAVE_ERROR = "V401"
    TOKEN_INSUFFICIENT = "V402"
    
    # Logging Errors (Non-critical)
    SHEETS_LOG_FAILED = "V501"
    
    # Generic Errors
    GENERIC_GENERATION_FAILED = "V999"

def get_error_msg(code: ViralStudioErrorCode) -> str:
    messages = {
        ViralStudioErrorCode.OPENAI_AUTH_ERROR: "OpenAI Authentication failed. Check your API Key.",
        ViralStudioErrorCode.OPENAI_RATE_LIMIT: "OpenAI Rate limit reached. Try again in a few seconds.",
        ViralStudioErrorCode.OPENAI_INVALID_RESPONSE: "AI returned a malformed response. Synthesis retry recommended.",
        ViralStudioErrorCode.OPENAI_QUOTA_EXCEEDED: "OpenAI quota exceeded. Refill your billing balance.",
        ViralStudioErrorCode.GEMINI_TEXT_FAILED: "Dual-Engine failure: Both OpenAI and Gemini synthesis failed.",
        ViralStudioErrorCode.GEMINI_AUTH_ERROR: "Gemini Authentication failed. Check your GOOGLE_API_KEY.",
        ViralStudioErrorCode.IMAGEN_AUTH_ERROR: "Google Imagen Authentication failed.",
        ViralStudioErrorCode.IMAGEN_MODEL_NOT_FOUND: "Specified Imagen model not available in your region.",
        ViralStudioErrorCode.IMAGEN_SAFETY_BLOCKED: "Image generation blocked by safety filters. Narrative calibration required.",
        ViralStudioErrorCode.IMAGEN_TIMEOUT: "Image synthesis timed out. Network latency detected.",
        ViralStudioErrorCode.IMAGEN_UNKNOWN_ERROR: "An unexpected error occurred during image synthesis.",
        ViralStudioErrorCode.FS_SAVE_ERROR: "Internal Storage Error: Failed to save generated asset.",
        ViralStudioErrorCode.TOKEN_INSUFFICIENT: "Insufficient PRO tokens for this operation.",
        ViralStudioErrorCode.SHEETS_LOG_FAILED: "Background audit logging failed.",
        ViralStudioErrorCode.GENERIC_GENERATION_FAILED: "The AI agent encountered a critical error during synthesis."
    }
    return messages.get(code, "Unknown system error.")
