const {
  activePlayersList,
  daysToMs,
} = require('../util');

class RBI {
  /* eslint-disable class-methods-use-this */

  /**
   * _storyCompletedInPastWeeks - calculates if a story was completed in the
   * past number of weeks
   *
   * @param  {string} estimatedCompleteDate Date of estimatedCompleteDate
   * @param  {number} numWks Sets the range that we want for number of weeks
   * @return {boolean}       true or false depending when the story was completed
   */
  _storyCompletedInPastWeeks(estimatedCompleteDate, numWks = 8) {
    const msInPast = daysToMs(numWks * 7);
    const pastDate = new Date() - msInPast;
    if (estimatedCompleteDate.getTime() > pastDate) {
      return true;
    }
    return false;
  }

  /**
   * _formatUsrData - formats the user data into an array rather than an object
   * and removes inactive players
   *
   * @param  {object} storiesByAssignee Each user and their completed stories
   * @return {array}                   active users and their associated stories
   */
  _formatUsrData(storiesByAssignee) {
    const activeUsersAndStories = [];
    const storiesEntries = Object.entries(storiesByAssignee);
    storiesEntries.forEach((itm) => {
      if (activePlayersList.includes(itm[0])) {
        activeUsersAndStories.push({
          assignee: itm[0],
          storiesList: itm[1],
        });
      }
    });
    return activeUsersAndStories;
  }


  /**
   * _calcRBI - removes stories that weren't completed in the grace period and
   * calculates the number of story points that are associated with the remaingin stories
   *
   * @param  {array} activeUsrsArr array of active users and associated stories
   * @return {array} array of objects which contain assignee, their qualifed
   *                 stories and their RBI for the given period
   */
  _calcRBI(activeUsrsArr) {
    return activeUsrsArr.map((usr) => {
      let rbi = 0;
      const { assignee, storiesList } = usr;
      const qualifiedStories = storiesList.filter((story) => {
        const { estimationDifference, storypoints, estimatedCompleteDate } = story;
        if (
          estimationDifference < 3
          && estimationDifference > -10
          && this._storyCompletedInPastWeeks(estimatedCompleteDate)
        ) {
          rbi += storypoints;
          return true;
        }
        return false;
      });
      return {
        rbi,
        assignee,
        storiesList: qualifiedStories,
      };
    });
  }


  /**
   * _sortRBI - sorts users from highest RBI to lowest
   *
   * @param  {array} rbiByAssignee array of batting averages and rbi values by user
   * @return {array}               sorted array of rbi data
   */
  _sortRBI(rbiByAssignee) {
    return rbiByAssignee.sort((a, b) => {
      return b.rbi - a.rbi;
    });
  }


  /**
   * _getRBILeaders - removes every user but the top 3, removes any extraneous data
   *
   * @param  {array} sortedRbi sorted rbi data
   * @return {array}           top 3 rbi users, only rbi data and assigneed
   */
  _getRBILeaders(sortedRbi) {
    return sortedRbi.slice(0, 3).map(({ assignee, rbi }) => {
      return {
        assignee,
        rbi,
      };
    });
  }


  /**
   * createRBILeaderboardData - Calls all of the functions that massagae the data
   * to make the rbi leaderboard
   *
   * @param  {array} battingAveragesByAssignee array of batting averages and rbi information
   * @return {array}                 all of the information needed to generate the rbi leaderboard
   */
  createRBILeaderboardData(storiesByAssignee) {
    const activeUsrsArr = this._formatUsrData(storiesByAssignee);
    const rbiByAssignee = this._calcRBI(activeUsrsArr);
    const sortedRBI = this._sortRBI(rbiByAssignee);
    return this._getRBILeaders(sortedRBI);
  }
}

module.exports = new RBI();
