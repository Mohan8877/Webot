"""
Web Scraper Module
Handles scraping public websites and extracting clean text content.
"""

import re
import time
import urllib.robotparser
from urllib.parse import urljoin, urlparse
from typing import Optional, List, Set
import requests
from bs4 import BeautifulSoup


class WebScraper:
    """Scrapes websites and extracts clean text content."""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })
        self.timeout = 30
        self.max_pages = 10  # Limit pages to scrape
        self.visited_urls: Set[str] = set()
    
    def can_fetch(self, url: str) -> bool:
        """Check if we're allowed to fetch the URL based on robots.txt."""
        try:
            parsed = urlparse(url)
            robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
            
            rp = urllib.robotparser.RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            
            return rp.can_fetch('*', url)
        except Exception:
            # If we can't read robots.txt, assume we can fetch
            return True
    
    def is_valid_page(self, url: str) -> bool:
        """Check if URL is a valid public page to scrape."""
        parsed = urlparse(url)
        path = parsed.path.lower()
        
        # Skip login, admin, and private pages
        skip_patterns = [
            '/login', '/signin', '/signup', '/register',
            '/admin', '/dashboard', '/account', '/profile',
            '/cart', '/checkout', '/payment',
            '/api/', '/auth/', '/private/',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx',
            '.zip', '.rar', '.exe', '.dmg',
            '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico',
            '.mp3', '.mp4', '.avi', '.mov',
            '.css', '.js', '.json', '.xml'
        ]
        
        for pattern in skip_patterns:
            if pattern in path:
                return False
        
        return True
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s.,!?;:\'"()-]', '', text)
        
        # Remove very short lines (likely UI elements)
        lines = text.split('\n')
        lines = [line.strip() for line in lines if len(line.strip()) > 20]
        
        return '\n'.join(lines).strip()
    
    def extract_text_from_html(self, html: str, url: str) -> str:
        """Extract clean text content from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove unwanted elements
        for element in soup.find_all([
            'script', 'style', 'nav', 'footer', 'header',
            'aside', 'noscript', 'iframe', 'form',
            'button', 'input', 'select', 'textarea'
        ]):
            element.decompose()
        
        # Remove elements by class/id patterns (common for ads, menus, etc.)
        remove_patterns = [
            'nav', 'menu', 'sidebar', 'footer', 'header',
            'ad', 'ads', 'advertisement', 'banner',
            'cookie', 'popup', 'modal', 'social',
            'share', 'comment', 'related'
        ]
        
        for pattern in remove_patterns:
            for element in soup.find_all(class_=re.compile(pattern, re.I)):
                element.decompose()
            for element in soup.find_all(id=re.compile(pattern, re.I)):
                element.decompose()
        
        # Extract text from main content areas
        main_content = None
        
        # Try to find main content area
        for selector in ['main', 'article', '[role="main"]', '.content', '#content', '.post', '.article']:
            main_content = soup.select_one(selector)
            if main_content:
                break
        
        if main_content:
            text = main_content.get_text(separator='\n', strip=True)
        else:
            # Fallback to body
            body = soup.find('body')
            text = body.get_text(separator='\n', strip=True) if body else soup.get_text(separator='\n', strip=True)
        
        # Get page title
        title = soup.find('title')
        title_text = title.get_text(strip=True) if title else ''
        
        # Get meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        desc_text = meta_desc.get('content', '') if meta_desc else ''
        
        # Combine all text
        full_text = f"Page: {url}\n"
        if title_text:
            full_text += f"Title: {title_text}\n"
        if desc_text:
            full_text += f"Description: {desc_text}\n"
        full_text += f"\nContent:\n{text}"
        
        return self.clean_text(full_text)
    
    def get_links(self, html: str, base_url: str) -> List[str]:
        """Extract internal links from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        
        parsed_base = urlparse(base_url)
        base_domain = parsed_base.netloc
        
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            
            # Convert relative URLs to absolute
            full_url = urljoin(base_url, href)
            parsed = urlparse(full_url)
            
            # Only include internal links
            if parsed.netloc == base_domain:
                # Remove fragments and query strings for deduplication
                clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                
                if clean_url not in self.visited_urls and self.is_valid_page(clean_url):
                    links.append(clean_url)
        
        return list(set(links))  # Remove duplicates
    
    def scrape_page(self, url: str) -> Optional[str]:
        """Scrape a single page and return its text content."""
        try:
            if url in self.visited_urls:
                return None
            
            if not self.can_fetch(url):
                print(f"[SCRAPER] Blocked by robots.txt: {url}")
                return None
            
            self.visited_urls.add(url)
            
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            # Check content type
            content_type = response.headers.get('Content-Type', '').lower()
            if 'text/html' not in content_type:
                return None
            
            return self.extract_text_from_html(response.text, url)
            
        except requests.RequestException as e:
            print(f"[SCRAPER] Failed to fetch {url}: {str(e)}")
            return None
    
    def scrape_website(self, start_url: str) -> str:
        """
        Scrape a website starting from the given URL.
        Returns combined text content from multiple pages.
        """
        self.visited_urls.clear()
        all_content = []
        urls_to_visit = [start_url]
        
        while urls_to_visit and len(self.visited_urls) < self.max_pages:
            url = urls_to_visit.pop(0)
            
            print(f"[SCRAPER] Scraping: {url}")
            
            try:
                response = self.session.get(url, timeout=self.timeout)
                response.raise_for_status()
                
                content_type = response.headers.get('Content-Type', '').lower()
                if 'text/html' not in content_type:
                    continue
                
                self.visited_urls.add(url)
                
                # Extract text
                text = self.extract_text_from_html(response.text, url)
                if text and len(text) > 100:
                    all_content.append(text)
                
                # Get more links to visit
                if len(self.visited_urls) < self.max_pages:
                    new_links = self.get_links(response.text, url)
                    for link in new_links:
                        if link not in self.visited_urls and link not in urls_to_visit:
                            urls_to_visit.append(link)
                
                # Be polite - add delay between requests
                time.sleep(0.5)
                
            except Exception as e:
                print(f"[SCRAPER] Error scraping {url}: {str(e)}")
                continue
        
        # Combine all content
        combined_content = "\n\n" + "="*50 + "\n\n".join(all_content)
        
        print(f"[SCRAPER] Completed. Scraped {len(self.visited_urls)} pages, {len(combined_content)} characters")
        
        return combined_content
