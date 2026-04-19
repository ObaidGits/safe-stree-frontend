 export function convertToIST(mongoTimestamp) {
    const date = new Date(mongoTimestamp);
    
    // Convert to IST (UTC +5:30)
    const ISTOffset = 330 * 60 * 1000; // 5h 30m in milliseconds
    const istTime = new Date(date.getTime() + ISTOffset);
    
    // Get day, month, date, year
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[istTime.getUTCDay()];
    const monthName = months[istTime.getUTCMonth()];
    const dateNum = istTime.getUTCDate().toString().padStart(2, '0');
    const year = istTime.getUTCFullYear();
    
    // Get time components (HH:MM:SS)
    const hours = istTime.getUTCHours().toString().padStart(2, '0');
    const minutes = istTime.getUTCMinutes().toString().padStart(2, '0');
    const seconds = istTime.getUTCSeconds().toString().padStart(2, '0');
    
    // Construct final string
    return `${dayName} ${monthName} ${dateNum} ${year} ${hours}:${minutes}:${seconds} GMT+0530 (India Standard Time)`;
  }