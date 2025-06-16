// This function handles email signups securely
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get email from the request
    const { email } = JSON.parse(event.body);
    
    // Basic email validation
    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid email' })
      };
    }

    // Your Klaviyo configuration
    const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;
    const KLAVIYO_LIST_ID = 'UhgntB';

    // Create profile in Klaviyo
    const profileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2023-12-15'
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email: email,
            properties: {
              'Source': 'Waitlist Page',
              'Product Interest': '01 Supplement',
              'Signup Date': new Date().toISOString()
            }
          }
        }
      })
    });

    const profileData = await profileResponse.json();
    
    // Check if profile was created successfully
    if (!profileResponse.ok) {
      throw new Error('Failed to create profile');
    }

    const profileId = profileData.data.id;

    // Add profile to your Email List
    const listResponse = await fetch(`https://a.klaviyo.com/api/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2023-12-15'
      },
      body: JSON.stringify({
        data: [{
          type: 'profile',
          id: profileId
        }]
      })
    });

    if (listResponse.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Successfully added to waitlist' })
      };
    } else {
      throw new Error('Failed to add to list');
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Failed to process signup' })
    };
  }
};
