function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu("Website Editor")
    .addItem("Home", "showHomeSidebar")
    .addItem("News", "showNewsSidebar")
    .addItem("Community", "showMembersSidebar")
    .addToUi();
}

/** Sidebar openers */
function showHomeSidebar() {
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutputFromFile("HomeCMS").setTitle("Home")
  );
}

function showNewsSidebar() {
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutputFromFile("NewsCMS").setTitle("News")
  );
}

function showMembersSidebar() {
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutputFromFile("CommunityCMS").setTitle("Community")
  );
}
