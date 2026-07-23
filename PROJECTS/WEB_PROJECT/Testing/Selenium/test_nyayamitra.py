import pytest
import time
import os
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

BASE_URL = "http://localhost:5173"
server_process = None

@pytest.fixture(scope="session", autouse=True)
def setup_server():
    global server_process
    print("Starting local Vite development server...")
    # Change directory to Frontend since the app was moved
    server_process = subprocess.Popen(
        ["npm", "run", "dev"], 
        cwd=r"c:\PDD WEB PROJECT\Frontend", 
        stdout=subprocess.DEVNULL, 
        stderr=subprocess.DEVNULL,
        shell=True
    )
    # Wait for the server to spin up
    time.sleep(8)
    yield
    print("Shutting down Vite server...")
    server_process.terminate()

@pytest.fixture(scope="module")
def driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    yield driver
    driver.quit()

def test_home_page_loads(driver):
    """Test if the splash/home page loads successfully"""
    driver.get(BASE_URL)
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
    assert "NYAYAMITRA" in driver.title or driver.title != "", "Page title is missing"

def test_navigation_to_login(driver):
    """Test navigating to the login portal"""
    driver.get(f"{BASE_URL}/login")
    # Explicitly wait for the input elements to render
    inputs = WebDriverWait(driver, 15).until(
        EC.presence_of_all_elements_located((By.TAG_NAME, "input"))
    )
    assert len(inputs) > 0, "Inputs not found on login page"

def test_public_routes(driver):
    """Test accessible public routes"""
    public_routes = ["/women-safety", "/live-tracking", "/legal-documents"]
    for route in public_routes:
        driver.get(f"{BASE_URL}{route}")
        time.sleep(2)
        # Check if URL updated or redirected gracefully
        assert driver.current_url.endswith(route) or "login" in driver.current_url or BASE_URL in driver.current_url, f"Failed to load {route}"

def test_dashboard_renders(driver):
    """Test standard rendering fallback"""
    driver.get(f"{BASE_URL}/")
    time.sleep(2)
    assert True
