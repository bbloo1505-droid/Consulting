export default async function handler(req, res) {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    const latitude = Number(lat);
    const longitude = Number(lon);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({ error: "Latitude and longitude must be valid numbers." });
    }

    // Replace this with the exact MSES query layer later if needed
    const msesUrl =
      "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Environment/MattersOfStateEnvironmentalSignificance/MapServer/0/query";

    const params = new URLSearchParams({
      f: "json",
      geometry: JSON.stringify({
        x: longitude,
        y: latitude,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      returnIdsOnly: "true",
    });

    const response = await fetch(`${msesUrl}?${params.toString()}`);
    const data = await response.json();

    const hasMses =
      Array.isArray(data?.objectIds) && data.objectIds.length > 0;

    return res.status(200).json({
      latitude,
      longitude,
      mses: hasMses,
      raw: data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to check site.",
    });
  }
}
