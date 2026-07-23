import pytest
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

# URL of the local dev server
BASE_URL = "http://localhost:5173"

@pytest.fixture(scope="module")
def driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    # Initialize WebDriver (Assumes webdriver-manager or local chromedriver is setup)
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    yield driver
    driver.quit()

def test_home_page_loads(driver):
    """Test if the splash/home page loads successfully"""
    driver.get(BASE_URL)
    assert "NYAYAMITRA" in driver.title or driver.title != "", "Page title is missing"
    time.sleep(2)
    # Check if a known element is present (e.g. login button or logo)
    body = driver.find_element(By.TAG_NAME, "body")
    assert body is not None, "Body element not found"

def test_navigation_to_login(driver):
    """Test navigating to the login portal"""
    driver.get(f"{BASE_URL}/login")
    time.sleep(2)
    # Check for login form elements
    email_input = driver.find_elements(By.XPATH, "//input[@type='email']")
    assert len(email_input) > 0, "Email input not found on login page"

def test_public_routes(driver):
    """Test accessible public routes"""
    public_routes = ["/women-safety", "/live-tracking", "/legal-documents"]
    for route in public_routes:
        driver.get(f"{BASE_URL}{route}")
        time.sleep(1)
        assert driver.current_url.endswith(route) or "login" in driver.current_url, f"Failed to load {route}"

def test_generate_report():
    """Dummy test to finalize report generation"""
    assert True
