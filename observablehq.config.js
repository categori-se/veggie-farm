import {siteHeader, sharedPersistenceCopy} from "./scripts/lib/site-shell.mjs";

export default {
  title: "veggie.farm",
  head: ({path}) => path.replace(/\.html$/, "") === "/demo" ? `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'">` : "",
  root: "src",
  globalStylesheets: [],
  style: "style.css",
  preserveIndex: true,
  preserveExtension: true,
  sidebar: false,
  search: false,
  toc: true,
  header: siteHeader,
  markdownIt: sharedPersistenceCopy,
  footer: `<div class="vf-footer">
  <div>
    <strong>veggie.farm</strong>
    <p>Growing food. Building knowledge. <a href="https://veggie.farm/about/">Our story</a></p>
  </div>
  <span>Plan · Observe · Record · Improve</span>
</div>`,
  pages: [
    {name: "Home", path: "/"},
    {name: "Your account", path: "/login"},
    {name: "Garden Today", path: "/tools/today"},
    {name: "Garden Planning Studio", path: "/studio"},
    {name: "Account sandbox", path: "/demo"},
    {name: "Garden Notebook", path: "/tools/my-garden"},
    {name: "Tools", path: "/tools"},
    {name: "Garden Decision Lab", path: "/tools/garden-decisions"},
    {name: "Season Weather", path: "/tools/season-weather"},
    {name: "What Grows in This Bed", path: "/tools/what-grows-in-this-bed"},
    {name: "Data Sources", path: "/about/data-sources"},
    {name: "Our story", path: "/about/"},
    {name: "Welcome", path: "/content/"},
    {
      name: "Garden",
      pages: [
        {name: "Building a Garden That Improves Every Year", path: "/content/garden/building-a-garden-that-improves-every-year"},
        {name: "Planning", path: "/content/garden/planning-your-vegetable-garden"},
        {name: "Watering", path: "/content/garden/watering-wisely"},
        {name: "Climate", path: "/content/garden/understanding-your-climate"}
      ]
    },
    {
      name: "Vegetables",
      pages: [
        {name: "Vegetables", path: "/content/vegetables/"},
        {name: "Beans", path: "/content/vegetables/beans"},
        {name: "Beets", path: "/content/vegetables/beets"},
        {name: "Bok Choy", path: "/content/vegetables/bok-choy"},
        {name: "Carrots", path: "/content/vegetables/carrots"},
        {name: "Corn", path: "/content/vegetables/corn"},
        {name: "Collards", path: "/content/vegetables/collards"},
        {name: "Cucumbers", path: "/content/vegetables/cucumbers"},
        {name: "Garlic", path: "/content/vegetables/garlic"},
        {name: "Kale", path: "/content/vegetables/kale"},
        {name: "Lettuce", path: "/content/vegetables/lettuce"},
        {name: "Mizuna", path: "/content/vegetables/mizuna"},
        {name: "Onions", path: "/content/vegetables/onions"},
        {name: "Peas", path: "/content/vegetables/peas"},
        {name: "Peppers", path: "/content/vegetables/peppers"},
        {name: "Potatoes", path: "/content/vegetables/potatoes"},
        {name: "Radishes", path: "/content/vegetables/radishes"},
        {name: "Arugula", path: "/content/vegetables/arugula"},
        {name: "Spinach", path: "/content/vegetables/spinach"},
        {name: "Swiss Chard", path: "/content/vegetables/swiss-chard"},
        {name: "Tomatoes", path: "/content/vegetables/tomatoes"},
        {name: "Turnips", path: "/content/vegetables/turnips"},
        {name: "Winter Squash", path: "/content/vegetables/winter-squash"},
        {name: "Zucchini", path: "/content/vegetables/zucchini"}
      ]
    },
    {
      name: "Fruits",
      pages: [
        {name: "Fruits", path: "/content/fruits/"},
        {name: "Apples", path: "/content/fruits/apples"},
        {name: "Black Currants", path: "/content/fruits/black-currants"},
        {name: "Blueberries", path: "/content/fruits/blueberries"},
        {name: "Gooseberries", path: "/content/fruits/gooseberries"},
        {name: "Ground Cherries", path: "/content/fruits/ground-cherries"},
        {name: "Pears", path: "/content/fruits/pears"},
        {name: "Plums", path: "/content/fruits/plums"},
        {name: "Raspberries", path: "/content/fruits/raspberries"},
        {name: "Sour Cherries", path: "/content/fruits/sour-cherries"},
        {name: "Strawberries", path: "/content/fruits/strawberries"}
      ]
    },
    {
      name: "Herbs",
      pages: [
        {name: "Herbs", path: "/content/herbs/"},
        {name: "Basil", path: "/content/herbs/basil"},
        {name: "Cilantro", path: "/content/herbs/cilantro"},
        {name: "Dill", path: "/content/herbs/dill"},
        {name: "Mint", path: "/content/herbs/mint"},
        {name: "Parsley", path: "/content/herbs/parsley"},
        {name: "Rosemary", path: "/content/herbs/rosemary"},
        {name: "Sage", path: "/content/herbs/sage"},
        {name: "Thyme", path: "/content/herbs/thyme"}
      ]
    },
    {
      name: "Soil",
      pages: [
        {name: "Soil", path: "/content/soil/"},
        {name: "Building Healthy Soil", path: "/content/soil/building-healthy-soil"},
        {name: "Clay Soil", path: "/content/soil/clay-soil"},
        {name: "Compost as a Soil Practice", path: "/content/soil/compost-as-a-soil-practice"},
        {name: "Mulch and Soil Cover", path: "/content/soil/mulch-and-soil-cover"},
        {name: "Sandy Soil", path: "/content/soil/sandy-soil"},
        {name: "Soil Testing", path: "/content/soil/soil-testing"}
      ]
    },
    {
      name: "Compost",
      pages: [
        {name: "Composting at Home", path: "/content/compost/composting-at-home"}
      ]
    },
    {
      name: "Wildlife",
      pages: [
        {name: "Beneficial Insects", path: "/content/wildlife/beneficial-insects"}
      ]
    },
    {
      name: "Seasons & Calendar",
      pages: [
        {name: "The New England Garden, in Season", path: "/content/seasonal/"},
        {name: "April: Peony Disease Prevention", path: "/content/seasonal/april-peony-disease-prevention"},
        {name: "July: Cucumber Harvest Timing", path: "/content/seasonal/july-cucumber-harvest-timing"},
        {name: "August: Overgrown Cucumbers", path: "/content/seasonal/august-overgrown-yellow-cucumbers"},
        {name: "August: Fall Planting in Massachusetts", path: "/content/seasonal/august-fall-planting-massachusetts"},
        {name: "September: Succession Gardening", path: "/content/seasonal/september-succession-gardening"},
        {name: "September: Identifying Unknown Apples", path: "/content/seasonal/september-identifying-unknown-apples"},
        {name: "October: Peony Cleanup", path: "/content/seasonal/october-peony-cleanup"},
        {name: "General Seasonal Calendar", path: "/content/calendar/seasonal-garden-calendar"}
      ]
    },
    {
      name: "Field Notes",
      pages: [
        {name: "Field Notes Template", path: "/content/field-notes/field-notes-template"}
      ]
    },
    {
      name: "Reference",
      pages: [
        {name: "Plant Spacing", path: "/content/reference/plant-spacing"},
        {name: "Plant Database", path: "/content/reference/plant-database"},
        {name: "Gardening Library", path: "/content/reference/garden-knowledge-base"},
        {name: "Planting Together", path: "/content/reference/garden-knowledge-graph"},
        {name: "Garden Records", path: "/content/reference/garden-journal-schema"},
        {name: "Garden Planner Requirements", path: "/content/reference/garden-planner-requirements"},
        {name: "Image Credits", path: "/content/reference/image-credits"},
        {name: "Illustrations", path: "/content/reference/illustrations"},
        {name: "Site Evaluation and Roadmap", path: "/content/reference/site-evaluation-roadmap"},
        {name: "Garden Glossary", path: "/content/reference/garden-glossary"}
      ]
    }
  ]
};
