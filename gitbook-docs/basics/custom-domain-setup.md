---
icon: globe-pointer
---

# Custom Domain Setup

**Setting Up Your Custom Domain for Suggest Feature**

Follow these step-by-step instructions to set up your custom domain, change your DNS settings, and configure HTTPS/SSL for your Suggest Feature platform.

***

#### What Are Custom Domains?

Custom domains allow you to use your own branded URL for your Suggest Feature instance, such as `feedback.company.com`, instead of the default `company.suggestfeature.com`. You can also configure your domain to display your roadmap or specific boards.

#### Step-by-Step Guide to Set Up Your Custom Domain

**1. Configure Your DNS Settings**

First, you need to update your DNS settings to point to Suggest Feature:

<figure><img src="../.gitbook/assets/image (26).png" alt=""><figcaption><p>Cloudflare example DNS Cname mapping</p></figcaption></figure>

1. **Access Your DNS Provider:**\
   Log in to your DNS provider (e.g., CloudFlare, GoDaddy, Google Domains, Namecheap, etc.).
2. **Add a CNAME Record:**
   * Create a new CNAME record for your desired custom domain (e.g., `feedback.yoursite.com`).
   * Set the CNAME record to point to `"cname.suggestfeature.com"`.
3. **Instructions for Popular DNS Providers:**
   * [CloudFlare](https://support.cloudflare.com/hc/en-us/articles/200169046-How-do-I-add-a-CNAME-record-): Ensure you disable the orange cloud for your Suggest Feature domain.
   * [GoDaddy](https://godaddy.com/help/add-a-cname-record-19236)
   * [Google Domains](https://support.google.com/a/answer/47283?hl=en)
   * [Namecheap](https://www.namecheap.com/support/knowledgebase/article.aspx/9646/10/how-can-i-set-up-a-cname-record-for-my-domain)
   * [Netlify](https://docs.netlify.com/domains-https/custom-domains/configure-external-dns/#configure-a-subdomain)
   * [Bluehost](https://www.bluehost.com/help/article/dns-records-explained#CNAME)
   * [AWS Route 53](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html)
4. **Change DNS Target for Specific Domains:**\
   Make sure your DNS is correctly set to point exactly to `cname.suggestfeature.com`&#x20;

**2. Configure Your Custom Domain in Suggest Feature**

Once your DNS settings are updated, configure your custom domain in Suggest Feature:

<figure><img src="../.gitbook/assets/image (25).png" alt=""><figcaption><p>Admin Page Custom domain settings</p></figcaption></figure>

1. **Log in to Suggest Feature Admin Dashboard:**\
   Go to the admin dashboard and navigate to the 'Page Settings' section on the left pane.
2. **Navigate to 'Custom Domain':**\
   Find the 'Custom Domain' option in the settings.
3. **Add Your Custom Domain:**\
   Enter your custom domain (e.g., `feedback.yoursite.com`) into the field provided.

**3. HTTPS/SSL Setup**

HTTPS/SSL is automatically managed by Suggest Feature

* **First Request to Your Domain:**\
  Upon receiving the first request to your custom domain (e.g., `https://feedback.yoursite.com`), an SSL certificate will be requested from Let's Encrypt/Cloudflare.
* **Certificate Issuance Time:**\
  This process can take 5 to 60 seconds. Don't worry if the first request doesn't go through immediately. It will soon be secured.

#### Custom Domain Name Ideas

Here are some ideas for choosing your custom domain:

* `feedback.yourapp.com`
* `roadmap.yourapp.com`
* `features.yourapp.com`
* `building.yourapp.com`
* `open.yourapp.com`
* `changelog.yourapp.com`
* `submit.yourapp.com`
* `buildinpublic.yourapp.com`
* `ideas.yourapp.com`
* `voice.yourapp.com`
* `wishlist.yourapp.com`
* `support.yourapp.com`
* `suggestions.yourapp.com`
* `future.yourapp.com`
* `plans.yourapp.com`
* `updates.yourapp.com`

Feel free to choose a domain name that aligns with your brand!

#### Need Help?

If you need assistance at any point, reach out to us via live chat. We’re here to help!
