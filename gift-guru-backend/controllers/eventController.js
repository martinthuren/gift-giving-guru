// FULL CODE SNIPPET: controllers/eventController.js

const Person = require('../models/Person'); // Need the Person model
const AppError = require('../utils/appError'); // For error handling

exports.getUpcomingEvents = async (req, res, next) => {
    try {
        const userId = req.user.id; // Get user ID from protect middleware
        const daysAhead = 30; // How many days into the future to check

        // 1. Get today's date (reset time components for clean comparison)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 2. Calculate the end date of our window
        const windowEnd = new Date(today);
        windowEnd.setDate(today.getDate() + daysAhead);

        // 3. Find all people for this user who have a birthday set
        const people = await Person.find({ user: userId, birthday: { $ne: null } });

        // 4. Process each person to find upcoming birthdays
        const upcomingEvents = [];
        const currentYear = today.getFullYear();

        people.forEach(person => {
            const bday = person.birthday; // This is a Date object
            const bdayMonth = bday.getMonth(); // 0-11
            const bdayDay = bday.getDate(); // 1-31

            // Calculate the date of the next birthday occurrence
            let nextBirthdayDate = new Date(currentYear, bdayMonth, bdayDay);
            nextBirthdayDate.setHours(0, 0, 0, 0);

            // If this year's birthday has already passed, check next year's date
            if (nextBirthdayDate < today) {
                nextBirthdayDate.setFullYear(currentYear + 1);
            }

            // Check if the next birthday falls within our window (inclusive)
            if (nextBirthdayDate >= today && nextBirthdayDate <= windowEnd) {
                // Calculate days remaining
                const timeDiff = nextBirthdayDate.getTime() - today.getTime();
                // Use Math.ceil to include today (if birthday is today, diffDays is 0 after ceil, which is okay)
                // Or simply add 1 if you want today to show "0 days remaining" but mean "today".
                // Let's stick to standard diff: ceil(diff / ms_per_day)
                const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                upcomingEvents.push({
                    personId: person._id, // Useful for linking later
                    name: person.name,
                    relationship: person.relationship,
                    type: 'Birthday', // Add type for future (e.g., Anniversary)
                    date: nextBirthdayDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
                    daysRemaining: daysRemaining,
                });
            }
        });

        // 5. Sort events by days remaining (soonest first)
        upcomingEvents.sort((a, b) => a.daysRemaining - b.daysRemaining);

        // 6. Send the response
        res.status(200).json({
            status: 'success',
            results: upcomingEvents.length,
            data: {
                events: upcomingEvents,
            },
        });

    } catch (err) {
        next(err); // Pass errors to global error handler
    }
};