// server.mjs

import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 모듈에서 __dirname을 설정하는 부분
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// CORS 헤더 설정
app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// POST 요청을 처리하기 위한 Body Parser 설정
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// URL을 받아서 블로그 내용을 가져오는 엔드포인트
app.post('/fetchBlogContent', async (req, res) => {
    const url = req.body.url;

    try {
        const response = await fetch(url);
        const html = await response.text();

        // cheerio를 사용하여 HTML 파싱
        const $ = cheerio.load(html);

        // 제목 가져오기
        const title = $('.se-module.se-module-text.se-title-text').text().trim();

        // 제목에 특정 단어가 포함되어 있는지 확인
        const isTitleValid = title.includes(req.body.title);

        // 특정 div 요소 선택 (예: class가 se-main-container인 요소 내부의 모든 텍스트)
        const textContainer = $('.se-main-container');
        let totalText = '';

        // 각 텍스트 요소에서 텍스트 추출
        textContainer.find('div.se-component.se-text').each(function () {
            const paragraph = $(this).find('p.se-text-paragraph').text().trim();
            totalText += paragraph + ' ';
        });

        // 가져온 글 내용의 길이 (띄어쓰기 포함)
        const contentLength = totalText.length;

        // 사용자가 입력한 기준치 (예: 100)
        const standardLength = parseInt(req.body.contentLength);

        // 조건 검사
        const isContentValid = contentLength >= standardLength;

        // 사진 수 가져오기
        const photoCount = $('.se-component.se-image').length;

        // 지도(장소) 삽입 여부 확인
        const mapExists = html.includes('<iframe class="se2_iframe"');

        // 전체 공개 설정 확인
        const isPublic = html.includes('<span class="post_public">전체 공개</span>');

        // 응답 데이터 설정
        const responseData = {
            isSuccess: isTitleValid && isContentValid && mapExists && isPublic && (photoCount >= parseInt(req.body.photos)),
            titleValid: isTitleValid,
            contentValid: isContentValid,
            mapExists: mapExists,
            isPublic: isPublic,
            photoCount: photoCount
        };

        res.json(responseData);
    } catch (error) {
        console.error('Error fetching and parsing blog content:', error);
        res.status(500).send('Error fetching and parsing blog content');
    }
});

// 현재 값 저장하기 엔드포인트
app.post('/saveCurrentValue', async (req, res) => {
    const formData = req.body;
    const optionButtonsData = JSON.parse(formData.optionButtons);

    try {
        // 예시로 파일에 저장하는 방식을 사용
        await writeFile('currentValues.txt', JSON.stringify(formData, null, 2));
        res.send('현재 값이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('Error saving current value:', error);
        res.status(500).send('Error saving current value');
    }
});

// 최근 값 불러오기 엔드포인트
app.get('/loadRecentValue', async (req, res) => {
    try {
        // 절대 경로로 파일 경로 설정
        const filePath = path.resolve(__dirname, 'currentValues.txt');
        console.log('Reading file from:', filePath); // 파일 경로 출력
        const data = await readFile(filePath, 'utf8');
        const parsedData = JSON.parse(data);
        console.log('불러온 데이터:', parsedData); // 데이터 콘솔에 출력
        res.json(parsedData);
    } catch (error) {
        console.error('Error loading recent value:', error);
        res.status(500).send('Error loading recent value');
    }
});



// 서버 시작
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
