
import dayjs from "dayjs";


export function calculateEndDate(startDate, timePeriodValue) {
    // Ensure startDate is a Day.js object (if it's not already)
    let date = dayjs(startDate);

    switch (timePeriodValue) {
        case "24 Hours":
            date = date.add(24, "hour"); // Add 24 hours
            break;
        case "1 Week":
            date = date.add(1, "week"); // Add 1 week
            break;
        case "1 Month":
            date = date.add(1, "month"); // Add 1 month
            break;
        default:
            console.log("Invalid time period");
            return null;
    }

    // Return the updated date as a Day.js object
    return date;
}