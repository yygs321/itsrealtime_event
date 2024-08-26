import json
import re
import requests
from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def check_if_private_blog(url):
    driver = webdriver.Chrome(executable_path='/path/to/chromedriver')  # chromedriver 경로 수정 필요

    try:
        driver.get(url)

        # 최대 10초 동안 "비공개글" 텍스트가 포함된 팝업 탐지
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), '비공개글')]"))
        )
        return True  # 팝업이 발견되면 비공개 블로그로 간주
    except:
        return False  # 팝업이 발견되지 않으면 공개 블로그로 간주
    finally:
        driver.quit()



def crawl(url):
    result = {
        'title': '',
        'totalTextLength': '',
        'imageCount': '',
        'isPublic': False,
        'hasMap': False
    }

    try:

        # Selenium을 사용하여 비공개 블로그 여부 확인
        is_private = check_if_private_blog(url)
        if is_private:
            result['isPublic'] = False
            return result

        # 웹 페이지 요청
        response = requests.get(url)
        response.raise_for_status()  # HTTP 오류 확인
        result['isPublic'] = True  # 에러 없으면 전체공개

        # BeautifulSoup을 사용하여 HTML 파싱
        soup = BeautifulSoup(response.content, 'html.parser')

        # 타이틀 추출 및 검증
        title_element = soup.find(
            "span", class_=re.compile(r'se-fs- se-ff-.*'))
        if title_element:
            title = title_element.get_text(strip=True)
        else:
            title = ""

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

            img_tags = content.select('.se-module.se-module-image')
            for img in img_tags:
                image_count += 1

        # 결과 반환
        result['title'] = title
        result['totalTextLength'] = total_text_length
        result['imageCount'] = image_count

        # 지도 유무 확인
        map_elements = soup.select('a.se-map-info.__se_link')

        for element in map_elements:
            # 해당 요소 안에서 strong 태그 중 class가 se-map-title인 요소 찾기
            location = element.find('strong', class_='se-map-title')
            if location and location.text.strip() == '잇츠리얼타임 독서실 스터디카페':
                result['hasMap'] = True
                break

        # 지도 다른 버전
        location_elements = soup.select('.location')
        for element in location_elements:
            location = element.find('a')
            if location:
                result['hasMap'] = True
                break

        return result

    except Exception as e:
        # 오류 발생 시 처리
        result['isPublic'] = False
        return result


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
