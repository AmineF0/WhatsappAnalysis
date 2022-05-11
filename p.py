#importing modules
import pytesseract
from PIL import Image

# If you don't have tesseract executable in your PATH, include the following:
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract'

#converting image to text
print(pytesseract.image_to_string(Image.open(r'C:\Users\Amine\Pictures\Screenshots\Screenshot (14).png')))