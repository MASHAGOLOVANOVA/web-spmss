function formatDateTimeValue(num) {
    return num / 10 >= 1 ? `${num}` : `0${num}`;
}

export function FormatDateTime(dateStr) {
    const utcDate = GetUtcDate(dateStr);
    const day = formatDateTimeValue(utcDate.getDate());
    const month = formatDateTimeValue(utcDate.getMonth()+1);
    const year = utcDate.getFullYear();
    const hours = formatDateTimeValue(utcDate.getHours());
    const minutes = formatDateTimeValue(utcDate.getMinutes());
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function FormatDate(dateStr) {
    const utcDate = GetUtcDate(dateStr);
    const day = formatDateTimeValue(utcDate.getDate());
    const month = formatDateTimeValue(utcDate.getMonth()+1);
    const year = utcDate.getFullYear();
    return `${day}.${month}.${year}`;
}

export function GetUtcDate(dateStr) {
    let arr = dateStr.split("-");
    arr[2] = arr[2].split("T");
    arr[2][1] = arr[2][1].split(":");
    const day = arr[2][0];
    let month = arr[1];
    if (month[0] === "0"){
        month = month[1];
    }
    const year = arr[0];
    const hours = arr[2][1][0];
    const minutes = arr[2][1][1];
    let date = new Date(Date.UTC(year, month-1, day, hours, minutes, 0, 0));
    date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000 );
    return date;
}
