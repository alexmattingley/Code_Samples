const {
  getPastWeeksDates,
  findIssuesInDateRange,
  stringToColor,
  msToDays,
  activePlayersList,
} = require('../util');


/**
 * Class containing all of the functions for calculating batting Averages
 */
class Averages {
  /* eslint-disable class-methods-use-this */
  /* eslint-disable no-plusplus */

  constructor() {
    this.numOfWeeks = 20;
    this.rollingWeeks = 8;
    this.chronologicalWeeks = getPastWeeksDates(this.numOfWeeks);
  }

  /**
   * _isUserCurrent - checks to see if the user has closed a story in the past month
   *
   * @param  {array} personIssues Array of stories by assignee
   * @return {boolean}            returns false if user isnt current
   */
  _isUserCurrent(personIssues) {
    const lastCompletedIssueWeek = personIssues.length - 1;
    const gmtDate = new Date();
    const currentDateDay = msToDays(gmtDate.getTime());
    const lastResolvedDate = msToDays(
      new Date(personIssues[lastCompletedIssueWeek].resolutiondate).getTime(),
    );
    if (currentDateDay - lastResolvedDate > 30) {
      return false;
    }
    return true;
  }

  /**
   * _isUserActive - checks to see if the user is included in the active array
   *
   * @param  {array} personIssues Array of stories by assignee
   * @return {boolean}            returns false if user isnt active
   */

  _isUserActive(user) {
    if (activePlayersList.includes(user)) {
      return true;
    }
    return false;
  }

  /**
   * _calcBattingAvgs - calculates batting averages based on estimatedCompleteDate
   *
   * @param  {array} issues
   * @return {array}        return battingAvgs
   */
  _calcBattingAvgs(issues) {
    let battingTotal = 0;
    issues.forEach(({ estimationDifference }) => {
      // Any estimate less than 3 days over is a 'hit'
      if (estimationDifference < 3 && estimationDifference > -10) {
        battingTotal++;
      }
    });
    const battingAvg = (
      battingTotal ? (battingTotal / issues.length) : 0
    ).toFixed(3);
    return battingAvg;
  }

  /**
   * _filterByActiveUsers - Filter out any users which are no longer active
   *
   * @param  {array} storiesWithEst array of all stories with estimates
   * @return {array}                stories from all active users
   */
  _filterByActiveUsers(storiesWithEst) {
    const validStories = Object.assign([], storiesWithEst);
    return validStories.filter(({ assignee }) => {
      return !!this._isUserActive(assignee);
    });
  }

  /**
   * _organizeStoriesByDates - Organize all stories by their completion date for averaging
   *
   * @param  {array} validStories all stories from active users
   * @return {array}              array of all stories organized by date
   */
  _organizeStoriesByDates(validStories) {
    const arrayLength = this.numOfWeeks - this.rollingWeeks;
    const chronologicalWeeks = this.chronologicalWeeks.slice(0, arrayLength);
    return chronologicalWeeks.reduce((acc, week) => {
      const { start, end } = week;
      const issuesInDateRange = findIssuesInDateRange(start, end, validStories);
      acc.push({
        start,
        end,
        issuesInDateRange,
      });
      return acc;
    }, []);
  }


  /**
   * _generateTeamAvgObject - generate team average object from organized by date
   *
   * @param  {array} arrOrganizedByDate array of stories organized by date
   * @return {object} an object with all team averages organized by date that
   *                  can go directly into chart array.
   *                  eg { assignee: 'Team Average', averages: [{start, end, average}] }
   */
  _generateTeamAvgObject(arrOrganizedByDate) {
    const teamAvgDataPoint = { assignee: 'Team Average', averages: [] };
    return arrOrganizedByDate.reduce((acc, { start, end, issuesInDateRange }) => {
      acc.averages.push({
        start,
        end,
        average: this._calcBattingAvgs(issuesInDateRange),
      });
      return acc;
    }, teamAvgDataPoint);
  }

  calcTeamBattingAvg(storiesWithEst) {
    const activeUserStories = this._filterByActiveUsers(storiesWithEst);
    const arrOrganizedByDate = this._organizeStoriesByDates(activeUserStories);
    return this._generateTeamAvgObject(arrOrganizedByDate);
  }


  /**
   * getBattingAvgByAssignee - massage data into array with assignee, averages,
   * and RBI totals week by week
   *
   * @param  {array} storiesByAssignee - Stories organized by assignee
   * @param  {array} assigneeList - An array of assignee names
   * @return {array} - Array of objects with a list of averages by date and assignee
   */
  getBattingAvgByAssignee(storiesByAssignee, assigneeList) {
    return assigneeList.reduce((acc, assignee) => {
      const personIssues = storiesByAssignee[assignee];
      // Check to make sure the user is current
      if (this._isUserCurrent(personIssues) && this._isUserActive(personIssues[0].assignee)) {
        const results = [];
        for (let i = 0; i < this.numOfWeeks - this.rollingWeeks; i++) {
          const { start } = this.chronologicalWeeks[i];
          const { end } = this.chronologicalWeeks[this.rollingWeeks - 1 + i];
          const issuesInDateRange = findIssuesInDateRange(start, end, personIssues);
          if (issuesInDateRange.length > 0) {
            const average = this._calcBattingAvgs(issuesInDateRange);
            results.push({
              start, end, average,
            });
          } else {
            results.push({
              start, end, average: '-',
            });
          }
        }
        acc.push({ assignee, averages: results });
      }
      return acc;
    }, []);
  }


  /**
   * createBatAvgsForChart - creates dataset array for chart
   *
   * @param  {array} filteredBatAvg array of batting avgs by week
   * @return {array}                array for chart
   */
  createBatAvgsForChart(filteredBatAvg) {
    return filteredBatAvg.map(({ assignee, averages }) => {
      const label = assignee;
      const data = averages.map(({ average }) => {
        return average;
      });
      const borderColor = stringToColor(assignee);
      const borderWidth = 3;
      const fill = false;

      return {
        label, data, borderColor, borderWidth, fill,
      };
    });
  }


  /**
   * sortBatAverages - description
   *
   * @param  {type} filteredBatAvg description
   * @return {type}                description
   */
  sortBatAverages(filteredBatAvg) {
    return filteredBatAvg.sort((a, b) => {
      const avgs1 = a.averages;
      const avgs2 = b.averages;
      const aResult = avgs1[avgs1.length - 1].average;
      const bResult = avgs2[avgs2.length - 1].average;
      if (aResult === '-') {
        return -1;
      }
      return bResult - aResult;
    });
  }

  getTopBatAvgs(sortedAverages) {
    const numOfLeaders = 3;
    return sortedAverages.slice(0, numOfLeaders).map(({ assignee, averages }) => {
      return {
        assignee,
        average: averages[averages.length - 1].average,
      };
    });
  }
}

module.exports = new Averages();
