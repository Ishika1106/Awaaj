USER_POST_TEXT_EXPANSION_PROMPT = """Generate a clear, urgent, and professional first-person report based on the following incident data to help authorities understand the situation and take prompt legal action. The report should be suitable for law enforcement and legal proceedings. Highlight the severity, frequency, and duration of the abuse, the danger posed by the perpetrator, and the need for immediate intervention. Include the preferred contact method. Keep it concise but comprehensive. Do not use markdown.

CRITICAL — Follow these rules exactly:
1. Use the EXACT duration with its EXACT unit from the data (e.g., if Duration is "5 days", write "5 days", NOT "5 years", "5 months", "a week", or any other unit).
2. Use the EXACT frequency value as provided.
3. Include the location coordinates exactly as provided: "lat: <value>, lng: <value>".
4. The "Name:" field contains the person's real name. You MUST use this exact name in the report. Do NOT replace it with the word "victim" or any other generic term. The name must appear naturally in the first-person narrative (e.g., "My name is [actual name]").

Data:
{data}

Generate the report in first person, conveying the person's fear and urgency."""

USER_POST_TEXT_DECOMPOSITION_PROMPT = """
You are given a first-person paragraph written by someone who experienced domestic abuse. Carefully analyze the paragraph and extract the following structured information. Pay special attention to extract the person's actual name (not the word "victim"). Please respond in the exact format provided below for consistency.

Output Format: It must be a key value pair separated by :

1. Name: [Extracted Name or "Not specified"]

2. Location: [Extracted Location or "Not specified"]

3. Preferred way of contact: [Preferred Contact Method or "Not specified"]

4. Contact info: [Extracted Contact Info or "Not specified"]

5. Frequency of domestic violence: [e.g., Daily, Weekly, Occasionally, or "Not specified"]

6. Relationship with perpetrator: [e.g., Spouse, Partner, Family Member, or "Not specified"]

7. Severity of domestic violence: [Choose one based STRICTLY on the text evidence: Low (Verbal/Emotional only), Medium (Occasional minor physical or intimidation), High (Frequent physical abuse or threats), Very High (Life-threatening or severe ongoing abuse). Only choose High or Very High if there is clear evidence of physical abuse or threats. If no clear severity indicators exist, use "Not specified". Do NOT default to "High".]

8. Nature of domestic violence: [Physical, Emotional, Financial, Psychological, or Combination if applicable; otherwise "Not specified"]

9. Impact on children: [Description of impact on children if mentioned, or "Not specified"]

10. Culprit details: [Description of physical appearance, behavior, or other identifiers if available, or "Not specified"]

11. Other info: [Any additional information provided or "Not specified"]

Instructions for Extraction:

Look for keywords or phrases that indicate the person's name, location, and contact details.
Identify any specific contact method they prefer, such as phone or email.
Determine the frequency of abusive incidents and specify it in simple terms (e.g., daily, weekly).
Identify the relationship between the person and the abuser.
Rate the severity level based on clues in the text, choosing from Sev1 to Sev4.
Classify the nature of abuse (e.g., physical, emotional).
Note any impact on children as described.
Provide culprit details if the person describes the abuser's appearance, behavior, or other identifying traits.
Include any other relevant information that provides additional context.
Note: Use "Not specified" if a detail is missing from the text.
"""