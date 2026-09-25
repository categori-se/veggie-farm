// Calendar seasons organize Massachusetts reading tasks, not planting eligibility.
export function seasonForDate(day) {
 const month=Number(String(day).slice(5,7));
 if(!Number.isInteger(month)||month<1||month>12)throw new Error('A valid calendar month is required');
 return month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
}
export const seasonRoutes={
 spring:{title:'Spring',href:'/content/calendar/seasonal-garden-calendar#spring',tasks:[['Check planting conditions','/tools/today'],['Prepare the soil','/content/soil/building-healthy-soil'],['Plan bed spacing','/content/reference/plant-spacing'],['Record a sowing','/tools/my-garden']]},
 summer:{title:'Summer',href:'/content/calendar/seasonal-garden-calendar#summer',tasks:[['Check watering','/content/garden/watering-wisely'],['Compare harvest cues','/content/seasonal/july-cucumber-harvest-timing'],['Explore later sowings','/tools/today'],['Record crop progress','/tools/my-garden']]},
 autumn:{title:'Autumn',href:'/seasons/autumn',tasks:[['Plant & protect','/seasons/autumn#planting'],['Build soil health','/seasons/autumn#soil'],['Harvest & store','/seasons/autumn#harvest'],['Prepare next year','/seasons/autumn#next-year']]},
 winter:{title:'Winter',href:'/content/calendar/seasonal-garden-calendar#winter',tasks:[['Compare varieties','/content/reference/plant-database'],['Review your season','/tools/my-garden'],['Plan your beds','https://studio.veggie.farm/'],['Read soil-test results','/content/soil/soil-testing']]}
};
