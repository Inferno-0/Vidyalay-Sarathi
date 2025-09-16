# ai_service.py
import os
from typing import Optional, Dict, Any
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

class AIService:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Google AI service
        
        Args:
            api_key: Google AI API key. If None, will look for GOOGLE_API_KEY environment variable
        """
        self.api_key = api_key or os.getenv('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("Google AI API key is required. Set GOOGLE_API_KEY environment variable or pass api_key parameter.")
        
        # Configure the Google AI client
        genai.configure(api_key=self.api_key)
        
        # Initialize the model (using Gemini Pro as default)
        self.model = genai.GenerativeModel('gemini-pro')
        
        # Safety settings (optional - adjust as needed)
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }

    async def generate_content(self, prompt: str, **kwargs) -> str:
        """
        Generate content using Google AI
        
        Args:
            prompt: The input prompt
            **kwargs: Additional parameters for generation
            
        Returns:
            Generated text content
        """
        try:
            response = await self.model.generate_content_async(
                prompt,
                safety_settings=self.safety_settings,
                **kwargs
            )
            return response.text
        except Exception as e:
            raise Exception(f"Error generating content: {str(e)}")

    def generate_content_sync(self, prompt: str, **kwargs) -> str:
        """
        Synchronous version of generate_content
        
        Args:
            prompt: The input prompt
            **kwargs: Additional parameters for generation
            
        Returns:
            Generated text content
        """
        try:
            response = self.model.generate_content(
                prompt,
                safety_settings=self.safety_settings,
                **kwargs
            )
            return response.text
        except Exception as e:
            raise Exception(f"Error generating content: {str(e)}")

    async def generate_with_images(self, prompt: str, images: list, **kwargs) -> str:
        """
        Generate content with image inputs (for vision models)
        
        Args:
            prompt: The input prompt
            images: List of image data or PIL Images
            **kwargs: Additional parameters for generation
            
        Returns:
            Generated text content
        """
        try:
            # Switch to vision model for image processing
            vision_model = genai.GenerativeModel('gemini-pro-vision')
            content = [prompt] + images
            
            response = await vision_model.generate_content_async(
                content,
                safety_settings=self.safety_settings,
                **kwargs
            )
            return response.text
        except Exception as e:
            raise Exception(f"Error generating content with images: {str(e)}")

# Create a singleton instance with your API key
# For development, you can hardcode it temporarily, but use environment variables for production
ai = AIService(api_key="AIzaSyA0QL453JAvieHZLzirT8F957aaK7zFLjk")

# Alternative factory function (similar to the original genkit approach)
def create_ai_service(api_key: Optional[str] = None) -> AIService:
    """
    Factory function to create AI service instance
    
    Args:
        api_key: Google AI API key
        
    Returns:
        AIService instance
    """
    return AIService(api_key=api_key)

# Test function to verify the API key works
async def test_ai_connection():
    """Test the AI service connection"""
    try:
        result = await ai.generate_content("Hello, this is a test message. Please respond with 'AI service is working!'")
        print(f"✅ AI Service Test: {result}")
        return True
    except Exception as e:
        print(f"❌ AI Service Error: {e}")
        return False