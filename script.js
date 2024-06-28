function toggleOption(button) {
    const parent = button.parentNode;
    const buttons = parent.querySelectorAll('.option-button');
    buttons.forEach(btn => {
        btn.classList.remove('active', 'inactive');
        if (btn !== button) btn.classList.remove('selected');
    });
    if (button.classList.contains('selected')) {
        button.classList.remove('selected');
    } else {
        button.classList.add('selected');
        button.classList.add(button.textContent === 'O' ? 'active' : 'inactive');
    }
}

document.querySelectorAll('.option-buttons .option-button').forEach(button => {
    button.addEventListener('click', () => toggleOption(button));
});

function checkConditions() {
    const url = document.getElementById('url').value;
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const map = document.querySelector('.option-buttons[data-type="map"] .selected');
    const publicOption = document.querySelector('.option-buttons[data-type="public"] .selected');
    const photos = document.getElementById('photos').value;

    // 결과 초기화
    clearResults();

    // URL에서 블로그 내용 가져오기 예시
    fetch(url)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // 블로그 내용에서 제목 가져오기
            const blogTitle = doc.querySelector('blog-title-selector').innerText; // 실제 셀렉터로 변경해야 함

            // 블로그 내용에서 내용 가져오기
            const blogContent = doc.querySelector('blog-content-selector').innerText; // 실제 셀렉터로 변경해야 함

            // 블로그 내용에서 지도 삽입 여부 가져오기
            const hasMap = doc.querySelector('map-selector') !== null; // 실제 셀렉터로 변경해야 함

            // 블로그 내용에서 전체 공개 여부 가져오기
            const isPublic = doc.querySelector('public-selector') !== null; // 실제 셀렉터로 변경해야 함

            // 블로그 내용에서 사진 수 가져오기
            const blogPhotos = doc.querySelectorAll('photo-selector'); // 실제 셀렉터로 변경해야 함

            // 제목 조건 검사
            if (blogTitle.includes(title)) {
                setResult('result-title', true);
            } else {
                setResult('result-title', false, '블로그 제목에 해당 단어가 포함되지 않음');
            }

            // 내용 조건 검사
            if (blogContent.length >= content.length) {
                setResult('result-content', true);
            } else {
                setResult('result-content', false, `블로그 내용이 입력한 길이보다 짧음 (${blogContent.length}/${content.length})`);
            }

            // 지도 삽입 조건 검사
            if (map && map.textContent === 'O') {
                if (hasMap) {
                    setResult('result-map', true);
                } else {
                    setResult('result-map', false, '지도(장소) 삽입 없음');
                }
            } else {
                setResult('result-map', map && map.textContent === 'O', map && map.textContent === 'O' ? '' : '지도(장소) 삽입 없음');
            }

            // 전체 공개 설정 검사
            if (publicOption && publicOption.textContent === 'O') {
                if (isPublic) {
                    setResult('result-public', true);
                } else {
                    setResult('result-public', false, '블로그가 전체 공개되어 있지 않음');
                }
            } else {
                setResult('result-public', publicOption && publicOption.textContent === 'O', publicOption && publicOption.textContent === 'O' ? '' : '블로그가 전체 공개되어 있지 않음');
            }

            // 사진 수 조건 검사
            if (blogPhotos.length >= photos) {
                setResult('result-photos', true);
            } else {
                setResult('result-photos', false, `블로그 사진 수가 입력한 갯수보다 적음 (${blogPhotos.length}/${photos})`);
            }
        })
        .catch(error => {
            console.error('Error fetching blog content:', error);
            alert('블로그 내용을 가져오는 중에 오류가 발생했습니다.');
        });
}

function setResult(id, isSuccess, reason = '') {
    const resultElement = document.getElementById(id);
    const reasonElement = document.getElementById(`reason-${id.split('-')[1]}`);
    resultElement.innerText = isSuccess ? 'O' : 'X';
    resultElement.style.color = isSuccess ? 'blue' : 'red';
    if (!isSuccess && reason) {
        reasonElement.innerText = reason;
    }
}

function clearResults() {
    const results = document.querySelectorAll('td[id^="result-"]');
    const reasons = document.querySelectorAll('td[id^="reason-"]');
    results.forEach(result => result.innerText = '');
    reasons.forEach(reason => reason.innerText = '');
}
