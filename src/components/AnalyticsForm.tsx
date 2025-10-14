export const AnalyticsForm = () => {
  // This hidden form is required for Netlify to detect the form at build time
  return (
    <form 
      name="analytics" 
      data-netlify="true" 
      data-netlify-honeypot="bot-field"
      hidden
    >
      <input type="hidden" name="form-name" value="analytics" />
      <input type="hidden" name="bot-field" />
      <input type="text" name="timeSpent" />
      <input type="text" name="peopleAdded" />
      <input type="text" name="catchUpDetails" />
      <input type="text" name="pwaInstalled" />
      <input type="text" name="device" />
      <input type="text" name="location" />
      <input type="text" name="timestamp" />
    </form>
  );
};
