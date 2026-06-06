import urllib.request
import json
import time

API_URL = "http://localhost:7890/api/arena"
ENGINES = [
    "nemotron", "paddle", "lightonocr", "glm", "dots", "deepseek", "chandra", "gemma4", 
    "qwen3vl", "litparse", "mineru-diffusion", "lightonocr-original", "docowl", 
    "phi4-ocr", "smol-docling", "granite-docling", "aya-vision", "dolphin", 
    "qwen3-omni", "owlocr", "ocr-flux", "monkey-ocr", "numarkdown", "ocr-docker", 
    "gemma3", "falcon-ocr", "dolphin-v2", "youtu-vl", "pike-pdf", "openpage", 
    "documagnet", "hunyuan-ocr", "colpali", "pixl-passport", "nemotron-nano", 
    "nemotron-3-super", "nemotron-3-ultra", "nemotron-omni", "minicpm-v-4-6",
    "deepseek-v4", "paddle-vl-1-5"
]

def test_engine_with_retry(engine_id, max_retries=5, retry_delay=3):
    payload = {
        "engine": engine_id,
        "image": "arena/vl1_6_1.png"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print(f"Testing engine: {engine_id}...", flush=True)
    
    for attempt in range(1, max_retries + 1):
        start_time = time.time()
        req = urllib.request.Request(
            API_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=120) as res:
                elapsed = time.time() - start_time
                response_data = json.loads(res.read().decode("utf-8"))
                
                if response_data.get("success"):
                    text = response_data.get("text", "")
                    preview = text[:100].replace('\n', ' ')
                    print(f"  Attempt {attempt}: ✅ SUCCESS | Time: {elapsed:.2f}s | Preview: {preview}...", flush=True)
                    return True, elapsed, text
                else:
                    error = response_data.get("error", "Unknown error")
                    print(f"  Attempt {attempt}: ❌ FAILED | Time: {elapsed:.2f}s | Error: {error}", flush=True)
                    if attempt < max_retries:
                        time.sleep(retry_delay)
                    else:
                        return False, elapsed, error
        except Exception as e:
            elapsed = time.time() - start_time
            print(f"  Attempt {attempt}: ❌ ERROR | Time: {elapsed:.2f}s | Exception: {e}", flush=True)
            if attempt < max_retries:
                time.sleep(retry_delay)
            else:
                return False, elapsed, str(e)

def main():
    print("==========================================")
    print(f"STARTING TEST FOR ALL {len(ENGINES)} OCR ENGINES")
    print("==========================================")
    
    results = {}
    passed_count = 0
    
    for engine in ENGINES:
        success, elapsed, info = test_engine_with_retry(engine)
        results[engine] = {
            "success": success,
            "time": elapsed,
            "info": info
        }
        if success:
            passed_count += 1
        print("-" * 50)
        
    print("\nSUMMARY OF RESULTS:")
    print("==========================================")
    for engine, res in results.items():
        status = "✅ PASS" if res["success"] else "❌ FAIL"
        time_str = f"{res['time']:.2f}s" if res["success"] else "N/A"
        print(f"{engine:<25} | {status} | Time: {time_str}")
        
    print("==========================================")
    print(f"TOTAL PASSED: {passed_count} / {len(ENGINES)}")
    print("==========================================")

if __name__ == "__main__":
    main()
