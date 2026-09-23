/**
 * Sample tokens. They are CLEARLY FAKE and exist only for demonstration.
 * Time-based values are generated relative to "now" so each sample
 * reliably shows the scenario it is named after.
 */

function iso(offsetSeconds: number): string {
  return new Date(Date.now() + offsetSeconds * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function b64(s: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s)));
}

function toBase64Url(obj: object): string {
  return b64(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function samlResponse(opts: { issued: number; statusXml: string; assertion: boolean }): string {
  const { issued, statusXml, assertion } = opts;
  const assertionXml = assertion
    ? `
  <saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" ID="_fake_assertion_123" IssueInstant="${iso(issued)}" Version="2.0">
    <saml2:Issuer>https://idp.fake-company.example/saml</saml2:Issuer>
    <saml2:Subject>
      <saml2:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">jane.doe@fake-company.example</saml2:NameID>
      <saml2:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml2:SubjectConfirmationData InResponseTo="_fake_request_id_123456" NotOnOrAfter="${iso(issued + 300)}" Recipient="https://app.fake-company.example/saml/acs"/>
      </saml2:SubjectConfirmation>
    </saml2:Subject>
    <saml2:Conditions NotBefore="${iso(issued - 60)}" NotOnOrAfter="${iso(issued + 300)}">
      <saml2:AudienceRestriction>
        <saml2:Audience>https://app.fake-company.example/saml/metadata</saml2:Audience>
      </saml2:AudienceRestriction>
    </saml2:Conditions>
    <saml2:AuthnStatement AuthnInstant="${iso(issued - 5)}" SessionIndex="_fake_session_001">
      <saml2:AuthnContext>
        <saml2:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml2:AuthnContextClassRef>
      </saml2:AuthnContext>
    </saml2:AuthnStatement>
    <saml2:AttributeStatement>
      <saml2:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml2:AttributeValue>jane.doe@fake-company.example</saml2:AttributeValue>
      </saml2:Attribute>
      <saml2:Attribute Name="firstName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml2:AttributeValue>Jane</saml2:AttributeValue>
      </saml2:Attribute>
      <saml2:Attribute Name="lastName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml2:AttributeValue>Doe</saml2:AttributeValue>
      </saml2:Attribute>
      <saml2:Attribute Name="groups" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml2:AttributeValue>Engineering</saml2:AttributeValue>
        <saml2:AttributeValue>Admins</saml2:AttributeValue>
      </saml2:Attribute>
    </saml2:AttributeStatement>
  </saml2:Assertion>`
    : '';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<saml2p:Response xmlns:saml2p="urn:oasis:names:tc:SAML:2.0:protocol" Destination="https://app.fake-company.example/saml/acs" ID="_fake_response_123" InResponseTo="_fake_request_id_123456" IssueInstant="${iso(issued)}" Version="2.0">
  <saml2:Issuer xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion">https://idp.fake-company.example/saml</saml2:Issuer>
  <saml2p:Status>${statusXml}
  </saml2p:Status>${assertionXml}
</saml2p:Response>`;
  return b64(xml);
}

export interface Sample {
  id: string;
  label: string;
  description: string;
  build: () => string;
}

export const SAMPLES: Sample[] = [
  {
    id: 'jwt-valid',
    label: 'Valid JWT',
    description: 'OIDC ID token that expires in 1 hour',
    build: () => {
      const now = Math.floor(Date.now() / 1000);
      const header = { alg: 'RS256', typ: 'JWT', kid: 'fake-key-id-001' };
      const payload = {
        iss: 'https://auth.fake-company.example',
        sub: 'user-fake-12345',
        aud: 'fake-client-id',
        exp: now + 3600,
        iat: now - 30,
        nbf: now - 30,
        nonce: 'fake-nonce-abc123',
        email: 'jane.doe@fake-company.example',
        email_verified: true,
        name: 'Jane Doe',
        roles: ['admin', 'user'],
      };
      return `${toBase64Url(header)}.${toBase64Url(payload)}.ZmFrZS1zaWduYXR1cmUtbm90LXJlYWw`;
    },
  },
  {
    id: 'jwt-none',
    label: 'Broken JWT',
    description: 'Unsigned (alg: none), expired access token',
    build: () => {
      const now = Math.floor(Date.now() / 1000);
      const header = { alg: 'none', typ: 'JWT' };
      const payload = { iss: 'https://auth.fake-company.example/', aud: 'https://api.fake-company.example', scope: 'read:orders', exp: now - 7200, iat: now - 90000 };
      return `${toBase64Url(header)}.${toBase64Url(payload)}.`;
    },
  },
  {
    id: 'saml-expired',
    label: 'Expired SAML',
    description: 'Unsigned response captured 2 hours ago',
    build: () =>
      samlResponse({
        issued: -7200,
        statusXml: '\n    <saml2p:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>',
        assertion: true,
      }),
  },
  {
    id: 'saml-denied',
    label: 'SAML error',
    description: 'IdP returned RequestDenied',
    build: () =>
      samlResponse({
        issued: -10,
        statusXml:
          '\n    <saml2p:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Responder">\n      <saml2p:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:RequestDenied"/>\n    </saml2p:StatusCode>\n    <saml2p:StatusMessage>User is not assigned to this application.</saml2p:StatusMessage>',
        assertion: false,
      }),
  },
];
