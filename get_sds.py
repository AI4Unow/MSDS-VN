import urllib.request
import json
import urllib.parse
import os

os.makedirs('sample_sds', exist_ok=True)

chemicals = {
    'Silicon_Dioxide.pdf': 'Silicon+Dioxide',
    'Paracetamol.pdf': 'Paracetamol',
    'Glycerin.pdf': 'Glycerin',
    'Citric_Acid.pdf': 'Citric+Acid',
    'Ascorbic_Acid.pdf': 'Ascorbic+Acid'
}

def get_pdf(name, query):
    search_url = f"https://api.duckduckgo.com/?q=Safety+Data+Sheet+{query}+ext:pdf&format=json"
    # Actually DDG api doesn't work like this.
    pass

