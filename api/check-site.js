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

    const layers = [
      {
        name: "MSES protected area [estates]",
        url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Environment/MattersOfStateEnvironmentalSignificance/MapServer/1/query"
      },
      {
        name: "MSES protected area [nature refuges]",
        url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Environment/MattersOfStateEnvironmentalSignificance/MapServer/2/query"
      },
      {
        name: "MSES regulated vegetation [100m from wetland]",
        url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Environment/MattersOfStateEnvironmentalSignificance/MapServer/19/query"
      }
    ];

    const params = new URLSearchParams({
      f: "json",
      where: "1=1",
      geometry: JSON.stringify({
        x: longitude,
        y: latitude,
        spatialReference: { wkid: 4326 }
      }),
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      returnIdsOnly: "true",
      returnGeometry: "false"
    });

    const checks = await Promise.all(
      layers.map(async (layer) => {
        try {
          const response = await fetch(`${layer.url}?${params.toString()}`);
          const data = await response.json();

          const hit = Array.isArray(data?.objectIds) && data.objectIds.length > 0;

          return {
            name: layer.name,
            hit,
            count: hit ? data.objectIds.length : 0,
            error: data.error || null
          };
        } catch (err) {
          return {
            name: layer.name,
            hit: false,
            count: 0,
            error: "Layer request failed"
          };
        }
      })
    );

    const anyMses = checks.some((c) => c.hit);

    return res.status(200).json({
      latitude,
      longitude,
      mses: anyMses,
      hits: checks.filter((c) => c.hit),
      checks
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to check site." });
  }
}
