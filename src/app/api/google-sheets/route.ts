import { NextRequest, NextResponse } from 'next/server';

// Google Apps Script URL
const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbykR67NMd-dJGDDsYZwircxeYLHQ_0zJD_K12MM799lp6R-sR1WsT2MF--dRb5DZ_h74A/exec';

// Google Sheets ID (URL에서 추출)
const SHEET_ID = '1IV4O-bkyb7AaU9Pi_qKslUCNJsPVYKQfw2Gbc_Eew5M';

export async function GET(request: NextRequest) {
  try {
    // URL 쿼리 파라미터에서 sheetId, gid, 날짜 범위 가져오기
    // Apps Script는 'gid' 파라미터를 사용
    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('sheetId') || SHEET_ID;
    const gid = searchParams.get('gid');
    const fromDate = searchParams.get('fromDate'); // YYYY-MM-DD 형식
    const toDate = searchParams.get('toDate'); // YYYY-MM-DD 형식

    if (!gid) {
      return NextResponse.json(
        {
          success: false,
          error: 'gid 파라미터가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // Google Apps Script API 호출
    const urlWithParams = new URL(GOOGLE_APPS_SCRIPT_URL);
    urlWithParams.searchParams.append('sheetId', sheetId);
    urlWithParams.searchParams.append('gid', gid);
    
    // 날짜 범위 파라미터 추가 (있는 경우)
    if (fromDate) {
      urlWithParams.searchParams.append('fromDate', fromDate);
    }
    if (toDate) {
      urlWithParams.searchParams.append('toDate', toDate);
    }

    const response = await fetch(urlWithParams.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // CORS 문제 해결을 위한 옵션
      mode: 'cors',
      cache: 'no-cache',
    });

    // 응답 상태 확인
    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => '응답을 읽을 수 없습니다.');
      console.error('Google Apps Script 응답 오류:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
      });
      throw new Error(
        `Google Apps Script API 호출 실패: ${response.status} ${
          response.statusText
        }. 응답: ${errorText.substring(0, 200)}`
      );
    }

    // Content-Type 확인
    const contentType = response.headers.get('content-type');
    const responseText = await response.text();

    console.log('Google Apps Script 응답 정보:', {
      status: response.status,
      contentType,
      bodyLength: responseText.length,
      bodyPreview: responseText.substring(0, 200),
    });

    // JSON 파싱 시도
    let parsedData;
    try {
      if (contentType?.includes('application/json')) {
        parsedData = JSON.parse(responseText);
      } else {
        // JSON이 아닌 경우에도 파싱 시도 (일부 Apps Script는 Content-Type을 제대로 설정하지 않음)
        parsedData = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      throw new Error(
        `응답이 JSON 형식이 아닙니다. Content-Type: ${contentType}, 응답: ${responseText.substring(
          0,
          500
        )}`
      );
    }

    // Apps Script 응답 형식 확인: { rows: [...] } 또는 { error: "..." }
    if (parsedData.error) {
      return NextResponse.json(
        {
          success: false,
          error: parsedData.error,
        },
        { status: 400 }
      );
    }

    // rows 배열 반환
    return NextResponse.json(
      {
        success: true,
        data: parsedData.rows || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Google Sheets 데이터 가져오기 오류:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : '알 수 없는 오류가 발생했습니다.';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // sheetId와 tab이 body에 없으면 기본값 사용
    // Apps Script는 'tab' 파라미터를 사용
    const sheetId = body.sheetId || SHEET_ID;
    const tab = body.tab || body.tabName || 'Sheet1'; // 기본값: Sheet1

    // Google Apps Script API 호출 (POST 방식)
    // sheetId와 tab은 쿼리 파라미터로, rows는 body로 전달
    const urlWithParams = new URL(GOOGLE_APPS_SCRIPT_URL);
    urlWithParams.searchParams.append('sheetId', sheetId);
    urlWithParams.searchParams.append('tab', tab);

    const requestBody = {
      rows: body.rows || [],
    };

    const response = await fetch(urlWithParams.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      mode: 'cors',
      cache: 'no-cache',
    });

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => '응답을 읽을 수 없습니다.');
      console.error('Google Apps Script 응답 오류:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
      });
      throw new Error(
        `Google Apps Script API 호출 실패: ${response.status} ${
          response.statusText
        }. 응답: ${errorText.substring(0, 200)}`
      );
    }

    const contentType = response.headers.get('content-type');
    const responseText = await response.text();

    console.log('Google Apps Script 응답 정보:', {
      status: response.status,
      contentType,
      bodyLength: responseText.length,
      bodyPreview: responseText.substring(0, 200),
    });

    let parsedData;
    try {
      if (contentType?.includes('application/json')) {
        parsedData = JSON.parse(responseText);
      } else {
        parsedData = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      throw new Error(
        `응답이 JSON 형식이 아닙니다. Content-Type: ${contentType}, 응답: ${responseText.substring(
          0,
          500
        )}`
      );
    }

    // Apps Script 응답 형식 확인: { success: true, appended: number } 또는 { error: "..." }
    if (parsedData.error) {
      return NextResponse.json(
        {
          success: false,
          error: parsedData.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: parsedData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Google Sheets 데이터 가져오기 오류:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : '알 수 없는 오류가 발생했습니다.';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
