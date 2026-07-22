import re
import datetime
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, render_template, jsonify, request
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URLS = [
    "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml",
    "https://cloud.google.com/feeds/bigquery-release-notes.xml"
]

# Simple in-memory cache
cache = {
    "data": None,
    "last_fetched": None
}

def parse_html_content(raw_html, entry_date, entry_link):
    """
    Parses the HTML content inside an Atom entry into distinct update items.
    Often structured with <h3>Tag</h3> followed by <p>, <ul> elements.
    """
    soup = BeautifulSoup(raw_html, 'html.parser')
    items = []
    
    # Find all section headers (h3, h4, h2) or top-level elements
    headers = soup.find_all(['h3', 'h4', 'h2'])
    
    if not headers:
        # Fallback: treat whole content as single update item
        text_content = soup.get_text(separator=' ', strip=True)
        if text_content:
            items.append({
                "category": "General",
                "title": text_content[:80] + ("..." if len(text_content) > 80 else ""),
                "summary": text_content,
                "html": str(soup),
                "date": entry_date,
                "link": entry_link
            })
        return items

    for i, header in enumerate(headers):
        category = header.get_text(strip=True)
        
        # Collect sibling elements until the next header
        content_nodes = []
        curr = header.next_sibling
        while curr and curr.name not in ['h3', 'h4', 'h2']:
            if hasattr(curr, 'strip') and not curr.strip():
                curr = curr.next_sibling
                continue
            content_nodes.append(curr)
            curr = curr.next_sibling
            
        # Build html fragment and text summary
        fragment_html = "".join(str(node) for node in content_nodes).strip()
        fragment_soup = BeautifulSoup(fragment_html, 'html.parser')
        text_summary = fragment_soup.get_text(separator=' ', strip=True)
        
        if not text_summary:
            text_summary = category
            
        items.append({
            "category": category,
            "title": f"{category}: {text_summary[:90]}" if len(text_summary) > 90 else f"{category}: {text_summary}",
            "summary": text_summary,
            "html": fragment_html if fragment_html else f"<p>{text_summary}</p>",
            "date": entry_date,
            "link": entry_link
        })
        
    return items

def fetch_feed_data():
    raw_xml = None
    last_err = None
    
    for url in FEED_URLS:
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BigQueryReleaseNotesApp/1.0"}
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                raw_xml = resp.read().decode('utf-8')
                if raw_xml:
                    break
        except Exception as e:
            last_err = e

    if not raw_xml:
        raise Exception(f"Failed to fetch BigQuery feed from URLs. Error: {last_err}")

    # Parse XML Atom Feed
    root = ET.fromstring(raw_xml)
    
    # Atom namespace
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    all_sub_items = []
    
    for idx, entry in enumerate(root.findall('atom:entry', ns)):
        title_elem = entry.find('atom:title', ns)
        date_str = title_elem.text if title_elem is not None else ""
        
        id_elem = entry.find('atom:id', ns)
        entry_id = id_elem.text if id_elem is not None else f"item-{idx}"
        
        updated_elem = entry.find('atom:updated', ns)
        updated_iso = updated_elem.text if updated_elem is not None else ""
        
        link_elem = entry.find("atom:link[@rel='alternate']", ns)
        if link_elem is None:
            link_elem = entry.find("atom:link", ns)
        link_url = link_elem.attrib.get('href', 'https://cloud.google.com/bigquery/docs/release-notes') if link_elem is not None else 'https://cloud.google.com/bigquery/docs/release-notes'
        
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        parsed_items = parse_html_content(content_html, date_str, link_url)
        
        for item_idx, item in enumerate(parsed_items):
            item['id'] = f"{entry_id}-sub-{item_idx}"
            all_sub_items.append(item)
            
        entries.append({
            "id": entry_id,
            "date_title": date_str,
            "updated_iso": updated_iso,
            "link": link_url,
            "content_html": content_html,
            "sub_items": parsed_items
        })
        
    return {
        "entries": entries,
        "all_items": all_sub_items,
        "fetched_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes', methods=['GET'])
def get_release_notes():
    force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
    
    if not force_refresh and cache["data"] is not None:
        return jsonify({
            "status": "success",
            "cached": True,
            "fetched_at": cache["last_fetched"],
            "data": cache["data"]
        })
        
    try:
        data = fetch_feed_data()
        cache["data"] = data
        cache["last_fetched"] = data["fetched_at"]
        return jsonify({
            "status": "success",
            "cached": False,
            "fetched_at": data["fetched_at"],
            "data": data
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    print("Starting BigQuery Release Notes App on http://127.0.0.1:5000 ...")
    app.run(host='0.0.0.0', port=5000, debug=True)
