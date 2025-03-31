
import dayjs from "dayjs";


export function calculateEndDate(startDate, timePeriodValue) {
    // Ensure startDate is a Day.js object (if it's not already)
    let date = dayjs(startDate);

    switch (timePeriodValue) {
        case "Daily":
            date = date.add(24, "hour"); // Add Daily
            break;
        case "Weekly":
            date = date.add(1, "week"); // Add Weekly
            break;
        case "Monthly":
            date = date.add(1, "month"); // Add Monthly
            break;
        default:
            console.log("Invalid time period");
            return null;
    }

    // Return the updated date as a Day.js object
    return date;
}