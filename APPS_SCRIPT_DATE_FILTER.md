# Google Apps Script - 날짜 필터링 기능 추가

이 문서는 Google Apps Script에 날짜 범위 필터링 기능을 추가하는 방법을 설명합니다.

## 업데이트된 Apps Script 코드

다음 코드를 Google Apps Script 편집기에 붙여넣고 배포하세요:

```javascript
/** 공통 JSON 응답 함수 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * GET API → 시트 데이터 읽기 (날짜 필터링 지원)
 * 예: /exec?sheetId=xxx&gid=0&fromDate=2025-10-17&toDate=2025-11-16
 */
function doGet(e) {
  try {
    var sheetId = e.parameter.sheetId;
    var gid = e.parameter.gid;
    var fromDate = e.parameter.fromDate; // YYYY-MM-DD 형식
    var toDate = e.parameter.toDate; // YYYY-MM-DD 형식

    if (!sheetId) return jsonResponse({ error: 'sheetId required' });

    var ss = SpreadsheetApp.openById(sheetId);
    var sheet;

    // gid로 시트 찾기
    if (gid !== null && gid !== undefined && gid !== '') {
      var sheets = ss.getSheets();
      sheet = null;
      for (var i = 0; i < sheets.length; i++) {
        if (sheets[i].getSheetId().toString() === gid.toString()) {
          sheet = sheets[i];
          break;
        }
      }
      if (!sheet) {
        return jsonResponse({ error: 'Sheet not found with gid: ' + gid });
      }
    } else {
      return jsonResponse({ error: 'gid required' });
    }

    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues(); // 원시 값
    var displayValues = dataRange.getDisplayValues(); // 서식이 적용된 표시 값

    if (!values.length) return jsonResponse({ rows: [] });

    var header = values.shift();
    var displayHeader = displayValues.shift();

    // 날짜 컬럼 찾기 (첫 번째 컬럼 또는 '날짜', 'date' 컬럼)
    var dateColumnIndex = 0; // 기본값: 첫 번째 컬럼
    var dateHeaderName = header[0];

    // '날짜' 또는 'date' 컬럼 찾기
    for (var i = 0; i < header.length; i++) {
      var headerName = String(header[i]).toLowerCase();
      if (headerName === '날짜' || headerName === 'date') {
        dateColumnIndex = i;
        dateHeaderName = header[i];
        break;
      }
    }

    // 날짜가 없는 행 필터링 및 날짜 범위 필터링
    var rows = values
      .map(function (row, rowIndex) {
        var obj = {};
        header.forEach(function (key, i) {
          // 표시 값 사용 (서식 포함)
          obj[key] = displayValues[rowIndex][i];
        });
        return obj;
      })
      .filter(function (row) {
        // 첫 번째 열(날짜 컬럼)의 값 확인
        var dateValue = row[dateHeaderName];

        // 날짜 값이 있고 비어있지 않으면 유지
        if (
          dateValue === null ||
          dateValue === undefined ||
          dateValue === '' ||
          String(dateValue).trim() === ''
        ) {
          return false;
        }

        // 날짜 범위 필터링
        if (fromDate || toDate) {
          var rowDate = parseDateFromSheet(dateValue);
          if (!rowDate) return false;

          if (fromDate) {
            var from = parseDateParameter(fromDate);
            if (!from || rowDate < from) return false;
          }

          if (toDate) {
            var to = parseDateParameter(toDate);
            if (!to || rowDate > to) return false;
          }
        }

        return true;
      });

    return jsonResponse({ rows: rows });
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

/**
 * 시트의 날짜 문자열을 Date 객체로 변환
 * "2025.11.1" 또는 "2025.11.1 (토)" 형식 지원
 */
function parseDateFromSheet(dateStr) {
  if (!dateStr) return null;

  var str = String(dateStr);
  // "2025.11.1" 또는 "2025.11.1 (토)" 형식 파싱
  var match = str.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (!match) return null;

  var year = parseInt(match[1]);
  var month = parseInt(match[2]) - 1; // JavaScript Date는 0부터 시작
  var day = parseInt(match[3]);

  var date = new Date(year, month, day);
  // 시간을 00:00:00으로 설정하여 날짜만 비교
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * API 파라미터의 날짜 문자열을 Date 객체로 변환
 * "YYYY-MM-DD" 형식
 */
function parseDateParameter(dateStr) {
  if (!dateStr) return null;

  var parts = String(dateStr).split('-');
  if (parts.length !== 3) return null;

  var year = parseInt(parts[0]);
  var month = parseInt(parts[1]) - 1; // JavaScript Date는 0부터 시작
  var day = parseInt(parts[2]);

  var date = new Date(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * POST API → 시트에 데이터 쓰기 (append)
 * body(JSON):
 * {
 *    "rows": [
 *      {"date": "2025-11-15", "installs": 42, "revenue": 38.2},
 *      ...
 *    ]
 * }
 */
function doPost(e) {
  try {
    var sheetId = e.parameter.sheetId;
    var tab = e.parameter.tab || 'raw_data';
    if (!sheetId) return jsonResponse({ error: 'sheetId required' });
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName(tab);
    if (!sheet) return jsonResponse({ error: 'Tab not found: ' + tab });
    var data = JSON.parse(e.postData.contents || '{}');
    var rows = data.rows || [];
    if (!rows.length) return jsonResponse({ error: 'No rows in body' });
    // header 기준으로 정렬
    var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var values = rows.map(function (rowObj) {
      return header.map(function (h) {
        return rowObj[h] ?? '';
      });
    });
    // append
    sheet
      .getRange(sheet.getLastRow() + 1, 1, values.length, values[0].length)
      .setValues(values);
    return jsonResponse({ success: true, appended: values.length });
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}
```

## 주요 변경 사항

1. **날짜 파라미터 추가**: `fromDate`와 `toDate` 파라미터를 지원합니다 (YYYY-MM-DD 형식)
2. **날짜 파싱 함수**: 시트의 날짜 형식("2025.11.1")과 API 파라미터 형식("2025-11-01")을 모두 처리합니다
3. **날짜 범위 필터링**: Apps Script에서 날짜 범위에 맞는 데이터만 필터링하여 반환합니다
4. **성능 개선**: 클라이언트에서 필터링하지 않고 서버에서 필터링하여 네트워크 트래픽을 줄입니다

## 사용 예시

- 전체 데이터: `/exec?sheetId=xxx&gid=0`
- 날짜 범위 지정: `/exec?sheetId=xxx&gid=0&fromDate=2025-10-17&toDate=2025-11-16`
- 시작 날짜만: `/exec?sheetId=xxx&gid=0&fromDate=2025-10-17`
- 종료 날짜만: `/exec?sheetId=xxx&gid=0&toDate=2025-11-16`
