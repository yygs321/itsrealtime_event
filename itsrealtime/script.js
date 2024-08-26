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


// 결과를 특정 요소에 표시하는 함수
function setResult(id, isSuccess, reason = '') {
    const resultElement = document.getElementById(id);
    const reasonElement = document.getElementById(`reason-${id.split('-')[1]}`);
    resultElement.innerText = isSuccess ? 'O' : 'X';
    resultElement.style.color = isSuccess ? 'blue' : 'red';
    if (reasonElement) {
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

// 서버로부터 받은 데이터를 페이지에 표시하는 함수
function displayResults(data, requestDto) {
    setResult('result-title', data.isTitleSatisfied, `포함 단어: ${data.matchedWords.join(', ')}`);
    setResult('result-content', data.isLengthSatisfied, `${data.totalTextLength} / ${requestDto.content}`);
    setResult('result-photos', data.isPhotoCountSatisfied, `${data.imageCount} / ${requestDto.photos}`);
    setResult('result-public', data.isPublic === requestDto.publicOption, '');
    setResult('result-map', data.hasMap === requestDto.map, '');
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
        const { url, title, title_count, content, photos, optionButtons } = data;

        // 콘솔에 데이터 출력
        console.log(data);

        // Form 데이터로 입력 폼 채우기
        document.getElementById('url').value = url;
        document.getElementById('title').value = title;
        document.getElementById('title_count').value = title_count;
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
        // 블로그가 비공개인지 확인
        const isPrivateBlog = await checkIfPrivateBlog(url);

        if (isPrivateBlog) {
            showPrivateAlert(); // 비공개 알림 창 띄우기

            // 결과를 X 또는 O로 설정
            setResult('result-public', !requestDto.publicOption, ''); // 공개 옵션을 선택한 경우 X, 비공개 선택한 경우 O
            return; // 비공개 상태이므로 서버 요청을 생략
        }


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

        // 응답 데이터에서 isPublic 값을 확인
        if (data.isPublic === false) {
            // 비공개 블로그일 때
            showPrivateAlert(); // 비공개 알림 창 띄우기
        }

        // 결과를 화면에 표시
        displayResults(data, requestDto);
        
    } catch (error) {
        console.error('Error fetching blog content:', error);
        throw error;
    }
}

// 비공개 알림 창을 여는 함수
function showPrivateAlert() {
    document.getElementById('private-post-alert').style.display = 'flex';
}

// 비공개 알림 창을 닫는 함수
function closePrivateAlert() {
    document.getElementById('private-post-alert').style.display = 'none';
}

// 블로그의 비공개 여부를 확인하는 함수
async function checkIfPrivateBlog(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });

        // 상태코드 확인
        if (response.status === 403 || response.status === 404) {
            return true;
        }
        return false; // 공개 블로그
    } catch (error) {
        console.error('Error checking blog privacy:', error);
        return true; // 오류 발생 시 비공개로 간주
    }
}