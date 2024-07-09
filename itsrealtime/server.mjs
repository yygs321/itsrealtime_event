// server.mjs

import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeFile, readFile } from 'fs/promises';
import { spawn } from 'child_process';
import cors from 'cors';

// ESM 모듈에서 __dirname을 설정하는 부분
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// CORS 설정
app.use(cors());

// POST 요청을 처리하기 위한 Body Parser 설정
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// URL을 받아서 블로그 내용을 가져오는 엔드포인트
app.post('/fetchBlogContent', async (req, res) => {
    const url = req.body.url;

    try {
        const result = await runPythonScript(url);

        // 결과와 요청 값을 비교하여 포함된 단어들과 갯수를 가져옴
        const { isTitleSatisfied, matchedWords, matchedCount, isLengthSatisfied, isPhotoCountSatisfied }
            = compareRequestAndResult(req.body, result);

        // 결과에 matchedWords, matchedCount 등을 추가
        result.isTitleSatisfied = isTitleSatisfied;
        result.matchedWords = matchedWords;
        result.matchedCount = matchedCount;
        result.isLengthSatisfied = isLengthSatisfied;
        result.isPhotoCountSatisfied = isPhotoCountSatisfied;


        if (result) {
            res.json(result);
            console.log(result);
        } else {
            throw new Error('Python script execution failed or returned invalid result');
        }
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

// Python 크롤링 스크립트 실행 함수
function runPythonScript(url) {
    const m_url = "https://m." + url.replace("https://", "")
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [
            path.join(__dirname, 'crawl_script.py'),
            m_url
        ]);

        let result = '';
        let error = '';

        //정상 출력
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        //오류 출력
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        //종료시 이벤트
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(`Python script execution failed with code ${code}: ${error}`);
            } else {
                try {
                    const parsedResult = JSON.parse(result.trim());
                    resolve(parsedResult);
                } catch (parseError) {
                    reject(`Error parsing JSON: ${parseError}`);
                }
            }
        });
    });
}

// 요청 값과 결과 값을 비교하여 포함된 단어들과 갯수를 반환하는 함수
function compareRequestAndResult(request, result) {
    const matchedWords = [];
    let matchedCount = 0;
    let isTitleSatisfied = false;
    let isLengthSatisfied = false;
    let isPhotoCountSatisfied = false;
    const wordsToCheck = request.title.toLowerCase().split(',').map(word => word.trim().toLowerCase());

    wordsToCheck.forEach(word => {
        if (result.title.toLowerCase().includes(word)) {
            matchedWords.push(word);
            matchedCount++;
        }
    });

    if (matchedCount >= request.title_count) {
        isTitleSatisfied = true;
    }

    if (result.totalTextLength >= request.content) {
        isLengthSatisfied = true;
    }

    if (result.imageCount >= request.photos) {
        isPhotoCountSatisfied = true;
    }

    return { isTitleSatisfied, matchedWords, matchedCount, isLengthSatisfied, isPhotoCountSatisfied };
}