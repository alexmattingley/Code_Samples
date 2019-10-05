const {
  msToDays,
  extractCompletionDate,
  formatToSlashDate,
} = require('../util');

/**
 * Collection of methods which are concerned with Stories and issues from Jira
 */
/* eslint-disable class-methods-use-this */
class Stories {
  constructor(issues) {
    this.issues = issues;
  }


  /**
   * _calcCompleteDateAndDifference - Calculates the estimated complete date and
   * the estimated difference between the resolution date and the complete date.
   * NOTE: This is a temporary solution meant for the current implementation of
   * batting averages.
   *
   * @param  {string} resolutionDate resolution date provided by jira
   * @param  {type} estCompDateRaw Date from the story title (eg. 12/18)
   * @return {object}              Estimated completion date and the difference
   *                               between resolution date and the estimated date
   */

  _calcCompleteDateAndDifference(resolutionDate, estCompDateRaw) {
    // Get the formated date for the date the story was "resolved"
    const resolutionDateFormated = new Date(resolutionDate);
    // Get the month from the estimated Complete date
    const estCompleteDateMo = parseInt(estCompDateRaw.split('/')[0], 10);
    // Default estimated complete date year based on the resolution date
    let estCompleteYear = resolutionDateFormated.getFullYear();
    // If the story gets resolved in Jan, but the estimated month is december,
    // adjust the year value back to the december year
    if (resolutionDateFormated.getMonth() === 0 && estCompleteDateMo === 12) {
      estCompleteYear = resolutionDateFormated.getFullYear() - 1;
    // If the story gets resolved in december but the estimated complete date is January
    // adjust the year value forward to the next year of the estimated complete date
    } else if (resolutionDateFormated.getMonth() === 11 && estCompleteDateMo === 1) {
      estCompleteYear = resolutionDateFormated.getFullYear() + 1;
    }
    // Create completed date
    const estCompDate = new Date(`${estCompDateRaw}/${estCompleteYear}`);
    // Get the difference between the resolution date and the estimated complete date
    const estDiffDays = msToDays(formatToSlashDate(resolutionDate) - estCompDate);

    return {
      estCompDate,
      estDiffDays,
    };
  }


  /**
   * getIssuesByType - filters jira issues by type
   *
   * @param  {string} type   eg: 'story' allows us to filter for specific types of Jira info
   * @param  {array} issues issues array from getAllIssues
   * @return {array}        a list of issues matching the specified type
   */

  getIssuesByType(type, issues) {
    return issues.filter(({
      issuetype,
    }) => {
      return issuetype === type;
    });
  }


  /**
   * groupIssuesByAssignee - groups our stories by assignee
   *
   * @param  {array} issues = [] list of issues for grouping
   * @return {object}             object with issues grouped by assignee
   */
  groupIssuesByAssignee(issues = []) {
    this.storiesByAssignee = {};
    issues.forEach((issue) => {
      const { assignee } = issue;
      if (!assignee) {
        return;
      }
      if (!this.storiesByAssignee[assignee]) {
        this.storiesByAssignee[assignee] = [issue];
        return;
      }
      this.storiesByAssignee[assignee].push(issue);
    });
    return this.storiesByAssignee;
  }

  /**
   * assignIssuesEstDates - Adds issue estimate dates to issues object
   *
   * @param  {array} issues original issues array
   * @return {array}        new array with issue estimated dates included
   */
  assignIssuesEstDates(issues) {
    return issues.map((issue) => {
      const estCompDateRaw = extractCompletionDate(issue.summary);
      if (!estCompDateRaw) {
        return {
          estimatedCompleteDate: 'NONE',
          estimationDifference: undefined,
          ...issue,
        };
      }

      const {
        estCompDate,
        estDiffDays,
      } = this._calcCompleteDateAndDifference(issue.resolutiondate, estCompDateRaw);

      return {
        estimatedCompleteDate: estCompDate,
        estimationDifference: estDiffDays,
        ...issue,
      };
    });
  }

  /**
   * getAllStoriesWithEst - Get all stories with estimated dates
   *
   * @return {array}        array of issues which are stories and have estimated completion dates
   */
  getAllStoriesWithEst() {
    this.storiesWithEst = this.getIssuesByType('Story', this.assignIssuesEstDates(this.issues));
    return this.storiesWithEst;
  }

  /**
   * getAssigneeList - get a list of assignees
   *
   * @param  {array} storiesByAssignee an array of stories organized by assignee
   * @return {array}                   an array of assignee names
   */
  getAssigneeList(storiesByAssignee) {
    this.assigneeList = Object.keys(storiesByAssignee);
    return this.assigneeList;
  }
}

module.exports = Stories;
