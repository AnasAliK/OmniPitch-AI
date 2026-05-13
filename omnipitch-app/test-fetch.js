async function test() {
  try {
    const res = await fetch("https://www.fotmob.com/api/teams?id=8456");
    const data = await res.json();
    console.log("Team info keys:", Object.keys(data));
    console.log("Squad keys:", data.squad ? Object.keys(data.squad) : 'No squad');
    
    if (data.squad) {
        console.log("Squad len:", data.squad.length);
        console.log("First squad item:", Object.keys(data.squad[0]));
        console.log("First squad item title:", data.squad[0].title);
        if (data.squad[0].members) {
            console.log("First member:", Object.keys(data.squad[0].members[0]));
        }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
