import json
import requests
from bs4 import BeautifulSoup


def crawl(url):
    try:
        # 웹 페이지 요청
        response = requests.get(url)
        response.raise_for_status()  # HTTP 오류 확인

        # BeautifulSoup을 사용하여 HTML 파싱
        soup = BeautifulSoup(response.content, 'html.parser')

        # 타이틀 추출 및 검증
        title_element = soup.find("span", attrs={'class': 'se-fs- se-ff-'})
        if title_element:
            title = title_element.get_text(strip=True)
        else:
            title = "Title element not found"

        # 특정 클래스명을 가진 요소 선택
        contents = soup.select('.se-main-container .se-component')

        # 텍스트 길이와 이미지 개수 저장할 변수 초기화
        total_text_length = 0
        image_count = 0

        # 각 요소에 대해 처리
        for content in contents:
            if 'se-text' in content.get('class', []):
                # 텍스트 요소 처리
                text = content.get_text(strip=True)
                total_text_length += len(text)
            elif 'se-image' in content.get('class', []):
                # 이미지 요소 처리
                image_count += 1

        # 결과 반환
        result = {
            'title': title,
            'totalTextLength': total_text_length,
            'imageCount': image_count
        }
        return result

    except Exception as e:
        # 오류 발생 시 처리
        print(f"Error crawling content from {url}: {e}")
        return None


# 스크립트 실행 부분 (입력 받기)
if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        sys.exit(1)

    url = sys.argv[1]

    result = crawl(url)
    if result:
        # Python 딕셔너리를 JSON 문자열로 변환
        result = json.dumps(result)
        print(result)
    else:
        sys.exit(1)
