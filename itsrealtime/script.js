// JavaScript 코드

// 클릭한 옵션 버튼의 상태를 토글하는 함수
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

// 각 옵션 버튼에 클릭 이벤트를 추가하여 toggleOption 함수를 호출
document.querySelectorAll('.option-buttons .option-button').forEach(button => {
    button.addEventListener('click', () => toggleOption(button));
});

// 조건들을 검사하고 결과를 표시하는 함수
function checkConditions() {
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const map = document.querySelector('.option-buttons[data-type="map"] .selected');
    const publicOption = document.querySelector('.option-buttons[data-type="public"] .selected');
    const photos = document.getElementById('photos').value;
    const url = document.getElementById('url').value;

    // 결과 초기화
    clearResults();

    // 제목 조건 검사
    if (title.includes('포함')) {
        setResult('result-title', true);
    } else {
        setResult('result-title', false, '제목에 "포함"이 포함되지 않음');
    }

    // 내용 길이 조건 검사
    if (content.length >= 100) {
        setResult('result-content', true);
    } else {
        setResult('result-content', false, `내용이 100자 미만 (${content.length}/100)`);
    }

    // 지도(장소) 삽입 여부 확인
    if (map) {
        checkMapExistence(url);
    } else {
        setResult('result-map', false, '지도(장소) 삽입 없음');
    }

    // 전체 공개 설정 확인
    if (publicOption) {
        checkPublicSetting(url);
    } else {
        setResult('result-public', false, '전체 공개 설정되지 않음');
    }

    // 사진 갯수 조건 검사
    if (photos.length >= 5) {
        setResult('result-photos', true);
    } else {
        setResult('result-photos', false, `사진이 5장 미만 (${photos.length}/5)`);
    }
}

// 결과를 특정 요소에 표시하는 함수
function setResult(id, isSuccess, reason = '') {
    const resultElement = document.getElementById(id);
    const reasonElement = document.getElementById(`reason-${id.split('-')[1]}`);
    resultElement.innerText = isSuccess ? 'O' : 'X';
    resultElement.style.color = isSuccess ? 'blue' : 'red';
    if (!isSuccess && reason) {
        reasonElement.innerText = reason;
    }
}

// 모든 결과를 초기화하는 함수
function clearResults() {
    const results = document.querySelectorAll('td[id^="result-"]');
    const reasons = document.querySelectorAll('td[id^="reason-"]');
    results.forEach(result => result.innerText = '');
    reasons.forEach(reason => reason.innerText = '');
}

// 지도(장소) 삽입 여부를 확인하는 함수
function checkMapExistence(url) {
    fetchBlogContent(url)
        .then(content => {
            const mapExists = content.includes('<iframe class="se2_iframe"');
            setResult('result-map', mapExists, mapExists ? '' : '지도(장소) 삽입 없음');
        })
        .catch(error => {
            console.error('Error fetching blog content:', error);
            setResult('result-map', false, '블로그 내용을 가져오는 도중 오류 발생');
        });
}

// 전체 공개 설정 여부를 확인하는 함수
function checkPublicSetting(url) {
    fetchBlogContent(url)
        .then(content => {
            const isPublic = content.includes('<span class="post_public">전체 공개</span>');
            setResult('result-public', isPublic, isPublic ? '' : '전체 공개 설정되지 않음');
        })
        .catch(error => {
            console.error('Error fetching blog content:', error);
            setResult('result-public', false, '블로그 내용을 가져오는 도중 오류 발생');
        });
}

// 현재 값을 서버에 저장하는 함수
async function saveCurrentValue() {
    const form = document.getElementById('conditionForm');
    const formData = new FormData(form);

    // Option-buttons 상태 수집
    const optionButtons = document.querySelectorAll('.option-buttons');
    const optionButtonsData = {};
    optionButtons.forEach(buttonGroup => {
        const type = buttonGroup.getAttribute('data-type');
        const selectedButton = buttonGroup.querySelector('.option-button.selected');
        optionButtonsData[type] = selectedButton ? selectedButton.textContent.trim() === 'O' : null;
    });

    // formData에 optionButtonsData 추가
    formData.append('optionButtons', JSON.stringify(optionButtonsData));

    try {
        const response = await fetch('http://localhost:3000/saveCurrentValue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(formData)),
        });

        if (!response.ok) {
            throw new Error('현재 값 저장 중 오류 발생');
        }

        alert('현재 값이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('현재 값 저장 중 오류:', error);
        alert('현재 값 저장 중 오류가 발생했습니다.');
    }
}

// 최근 값을 서버에서 불러오는 함수
async function loadRecentValue() {
    try {
        const response = await fetch('http://localhost:3000/loadRecentValue');

        if (!response.ok) {
            throw new Error('최근 값 불러오기 중 오류 발생');
        }

        // response.json() 함수를 호출하여 실제 데이터를 얻습니다.
        const data = await response.json();
        const { url, title, count, content, photos, optionButtons } = data;

        // 콘솔에 데이터 출력
        console.log(data);

        // Form 데이터로 입력 폼 채우기
        document.getElementById('url').value = url;
        document.getElementById('title').value = title;
        document.getElementById('title_count').value = count;
        document.getElementById('content').value = content;
        document.getElementById('photos').value = photos;

        // Option-buttons 상태 복원
        const optionButtonsData = JSON.parse(optionButtons);
        for (const type in optionButtonsData) {
            if (optionButtonsData.hasOwnProperty(type)) {
                const selectedValue = optionButtonsData[type] ? 'O' : 'X';
                const buttonGroup = document.querySelector(`.option-buttons[data-type="${type}"]`);
                const buttons = buttonGroup.querySelectorAll('.option-button');
                buttons.forEach(button => {
                    button.classList.remove('selected', 'active', 'inactive');
                    if (button.textContent.trim() === selectedValue) {
                        button.classList.add('selected', selectedValue === 'O' ? 'active' : 'inactive');
                    }
                });
            }
        }


        alert('최근 값이 성공적으로 불러와졌습니다.');
    } catch (error) {
        console.error('최근 값 불러오기 중 오류:', error);
        alert('최근 값 불러오기 중 오류가 발생했습니다.');
    }
}



// 블로그 내용을 가져오는 함수
async function fetchBlogContent() {
    const url = document.getElementById('url').value;
    const title = document.getElementById('title').value;
    const title_count = parseInt(document.getElementById('title_count').value, 10);
    const content = parseInt(document.getElementById('content').value, 10);
    const photos = parseInt(document.getElementById('photos').value, 10);
    const map = document.querySelector('.option-buttons[data-type="map"] .selected');
    const publicOption = document.querySelector('.option-buttons[data-type="public"] .selected');


    const requestDto = {
        url: url,
        title: title,
        title_count: title_count,
        content: content,
        photos: photos,
        map: map ? map.textContent === 'O' : false,
        publicOption: publicOption ? publicOption.textContent === 'O' : false
    };

    console.log('보내는 데이터:', requestDto); // 보내는 데이터 확인

    try {

        const response = await fetch('http://localhost:3000/fetchBlogContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestDto),
            mode: 'cors' //CORS 설정 활성화
        })
        if (!response.ok) {
            throw new Error('네트워크 응답이 실패했습니다.');
        }

        const data = await response.json(); // JSON 형식으로 파싱된 데이터 반환
        console.log('서버로부터 받은 데이터:', data);

    } catch (error) {
        console.error('Error fetching blog content:', error);
        throw error;
    }
}