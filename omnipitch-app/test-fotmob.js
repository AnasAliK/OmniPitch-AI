const Fotmob = require('fotmob').default;
const fotmob = new Fotmob();

async function test() {
  try {
    const teamId = 8456; // Manchester City
    const teamData = await fotmob.getTeam(teamId, "overview", "team", "ENG");
    console.log(Object.keys(teamData));
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
