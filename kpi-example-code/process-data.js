const issues = require('../src/jira.json');
const Stories = require('./stories.js');
const Averages = require('./averages.js');
const RunsBattedIn = require('./rbi.js');
const { calculateCurrentDate } = require('../util/');

/**
 * This function is responsible for orchestrating all of the neccessary
 * actions and ends with writing a stats file
 */
export default async () => {
  const storiesInstance = new Stories(issues);
  const storiesWithEst = storiesInstance.getAllStoriesWithEst();
  const storiesByAssignee = storiesInstance.groupIssuesByAssignee(storiesWithEst);
  const assigneeList = storiesInstance.getAssigneeList(storiesByAssignee);
  const battingAveragesByAssignee = Averages.getBattingAvgByAssignee(
    storiesByAssignee, assigneeList,
  );

  // Calculate team batting average and create chart data points for team avg
  const teamBattingAvgObject = Averages.calcTeamBattingAvg(storiesWithEst);

  // Massage and format data for chart
  battingAveragesByAssignee.push(teamBattingAvgObject);
  const datasets = Averages.createBatAvgsForChart(battingAveragesByAssignee);
  const labels = battingAveragesByAssignee[0].averages.map(({ end }) => end.toLocaleDateString());
  const rollingAverageChartData = {
    labels,
    datasets,
  };

  // Massage and format data for RBI leaderboard
  const runsBattedInLeaders = RunsBattedIn.createRBILeaderboardData(storiesByAssignee);

  // Massage and format data for batAvgLeaderboard
  const sortedAverages = Averages.sortBatAverages(battingAveragesByAssignee);
  const batAvgLeaderboard = Averages.getTopBatAvgs(sortedAverages);

  return {
    rollingAverageChartData,
    created: calculateCurrentDate(),
    batAvgLeaderboard,
    runsBattedInLeaders,
  };
};
