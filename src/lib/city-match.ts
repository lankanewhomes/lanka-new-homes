// "Explore by city" (homepage) and the search page it opens share ONE rule, so the number on a tile is the number of results you land
// on. A project is in a city when its city is that name (or "Colombo 05" style), or its district is (or lists) it. Street names in the
// address do not count: "Galle Road" in Colombo is not Galle, and a "Kandy Road" in Gampaha is not Kandy.
export function tileCityMatches(project: { city?: string; district?: string }, name: string): boolean {
  const wanted = name.toLowerCase();
  const city = (project.city ?? "").toLowerCase();
  const district = (project.district ?? "").toLowerCase();
  return city === wanted || city.startsWith(`${wanted} `) || district === wanted || district.split(/\s*[&,]\s*/).includes(wanted);
}
