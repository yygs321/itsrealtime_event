// server.mjs

import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
// cors 미들웨어 import 추가
import cors from 'cors';

// ESM 모듈에서 __dirname을 설정하는 부분
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// CORS 설정
app.use(cors());

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
    console.log("?????")
    const url = req.body.url;
    console.log(url)
    const wordsToCheck = req.body.title.split(',');

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // HTTP 응답이 실패한 경우 에러 처리
            throw new Error('Network response was not ok');
        }

        // HTML 텍스트 추출
        const html = await response.text();

        // cheerio를 사용하여 HTML 파싱
        const $ = cheerio.load(html);

        // 제목 가져오기
        const title = $('.se-module.se-module-text.se-title-text').text().trim();

        // 단어 포함 여부 체크 및 포함된 단어 수 세기
        let validCount = 0;
        let validWords = []; // 포함된 단어들을 저장할 배열
        for (const word of wordsToCheck) {
            if (title.includes(word)) {
                validCount++;
                validWords.push(word); // 포함된 단어를 배열에 추가
            }
        }

        // count 개 이상 포함되는지 여부
        const isTitleValid = validCount >= parseInt(req.body.count);


        /*
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
                const isPublic = html.includes('<span class="post_public">전체 공개</span>');*/

        // 응답 데이터 설정
        const responseData = {
            titleValid: {
                wordCounts: validCount, // 포함된 단어의 수
                isValid: isTitleValid, // count 개 이상 포함되는지 여부
                validWords: validWords // 포함된 단어들의 리스트
            }
            /*,
            contentValid: isContentValid,
            mapExists: mapExists,
            isPublic: isPublic,
            photoCount: photoCount*/
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
