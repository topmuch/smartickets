'use client';

import SecondaryPageLayout from '@/components/landing/SecondaryPageLayout';

export default function Confidentialite() {
  return (
    <SecondaryPageLayout
      title="Politique de Confidentialité"
      subtitle="Comment nous protégeons vos données personnelles"
    >
      <div className="max-w-4xl mx-auto space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">1. Introduction</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            La société MMASOLUTION s&apos;engage à protéger la vie privée des utilisateurs de son site SmarticketS. La présente politique de confidentialité a pour but de vous informer sur la manière dont nous collectons, utilisons et protégeons vos données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD).
          </p>
          <p className="text-gray-600 leading-relaxed">
            En utilisant notre site et nos services, vous acceptez les pratiques décrites dans cette politique de confidentialité.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">2. Données collectées</h2>
          <p className="text-gray-600 leading-relaxed mb-4">Nous collectons les types de données suivantes :</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li><strong className="text-[#0A2540]">Données d&apos;identification :</strong> nom, prénom, adresse email, numéro de téléphone</li>
            <li><strong className="text-[#0A2540]">Données de voyage :</strong> informations relatives aux colis enregistrés, dates de voyage, destinations</li>
            <li><strong className="text-[#0A2540]">Données de connexion :</strong> adresse IP, type de navigateur, pages visitées, durée des sessions</li>
            <li><strong className="text-[#0A2540]">Données de localisation :</strong> localisation approximative lors du scan des QR codes</li>
            <li><strong className="text-[#0A2540]">Données de communication :</strong> messages envoyés via le formulaire de contact ou le chat intégré</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">3. Finalités du traitement</h2>
          <p className="text-gray-600 leading-relaxed mb-4">Vos données personnelles sont collectées et traitées pour les finalités suivantes :</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Gestion et suivi des colis enregistrés via le système SmarticketS</li>
            <li>Faciliter la restitution des colis perdus ou trouvés</li>
            <li>Communication avec les utilisateurs (notifications, alertes)</li>
            <li>Amélioration de nos services et de l&apos;expérience utilisateur</li>
            <li>Respect de nos obligations légales</li>
            <li>Envoi d&apos;informations commerciales (avec votre consentement)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">4. Base légale du traitement</h2>
          <p className="text-gray-600 leading-relaxed mb-4">Le traitement de vos données personnelles repose sur les bases légales suivantes :</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li><strong className="text-[#0A2540]">Exécution du contrat :</strong> pour la fourniture de nos services de protection des colis</li>
            <li><strong className="text-[#0A2540]">Consentement :</strong> pour l&apos;envoi de communications commerciales et l&apos;utilisation de cookies non essentiels</li>
            <li><strong className="text-[#0A2540]">Intérêt légitime :</strong> pour l&apos;amélioration de nos services et la sécurité du site</li>
            <li><strong className="text-[#0A2540]">Obligation légale :</strong> pour le respect de nos obligations réglementaires</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">5. Cookies</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Notre site utilise des cookies pour améliorer votre expérience de navigation. Un cookie est un petit fichier texte stocké sur votre appareil.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4"><strong className="text-[#0A2540]">Types de cookies utilisés :</strong></p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
            <li><strong className="text-[#0A2540]">Cookies essentiels :</strong> nécessaires au fonctionnement du site (session, sécurité)</li>
            <li><strong className="text-[#0A2540]">Cookies analytiques :</strong> pour mesurer l&apos;audience et améliorer le site (avec votre consentement)</li>
            <li><strong className="text-[#0A2540]">Cookies de préférence :</strong> pour mémoriser vos choix (langue, consentement RGPD)</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">
            Vous pouvez à tout moment modifier vos préférences en cliquant sur le bandeau cookies en bas de page ou en paramétrant votre navigateur.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">6. Durée de conservation</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Vos données personnelles sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Données de compte : durée de l&apos;inscription + 3 ans</li>
            <li>Données de colis : durée de validité du QR code + 1 an</li>
            <li>Données de connexion : 13 mois maximum</li>
            <li>Cookies : 13 mois maximum</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">7. Vos droits</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
            <li><strong className="text-[#0A2540]">Droit d&apos;accès :</strong> obtenir une copie de vos données</li>
            <li><strong className="text-[#0A2540]">Droit de rectification :</strong> corriger des données inexactes</li>
            <li><strong className="text-[#0A2540]">Droit à l&apos;effacement :</strong> demander la suppression de vos données</li>
            <li><strong className="text-[#0A2540]">Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
            <li><strong className="text-[#0A2540]">Droit d&apos;opposition :</strong> vous opposer au traitement de vos données</li>
            <li><strong className="text-[#0A2540]">Droit à la limitation :</strong> limiter le traitement de vos données</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">
            Pour exercer ces droits, contactez-nous à :{' '}
            <a href="mailto:contact@smartickets.com" className="text-[#FF6B35] hover:underline">contact@smartickets.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">8. Partage des données</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Vos données personnelles peuvent être partagées avec :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Nos partenaires de livraison pour l&apos;expédition des autocollants SmarticketS</li>
            <li>Les autorités compétentes si la loi l&apos;exige</li>
            <li>Nos prestataires techniques (hébergement, paiement) sous strictes conditions de confidentialité</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-4">
            Nous ne vendons jamais vos données personnelles à des tiers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">9. Sécurité</h2>
          <p className="text-gray-600 leading-relaxed">
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction. Ces mesures incluent le chiffrement des données, des pare-feu, et des accès restreints aux données.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">10. Contact</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Pour toute question relative à cette politique de confidentialité ou pour exercer vos droits, vous pouvez nous contacter :
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            <strong className="text-[#0A2540]">Email :</strong>{' '}
            <a href="mailto:contact@smartickets.com" className="text-[#FF6B35] hover:underline">contact@smartickets.com</a>
            <br />
            <strong className="text-[#0A2540]">Adresse :</strong> Cité Alia Diène, Ouest Foire, Yoff, Sénégal
          </p>
          <p className="text-gray-600 leading-relaxed">
            Vous avez également le droit d&apos;introduire une réclamation auprès de la CNIL (Commission Nationale de l&apos;Informatique et des Libertés) si vous estimez que le traitement de vos données n&apos;est pas conforme à la réglementation.
          </p>
        </section>

        <div className="pt-8 border-t border-gray-200">
          <p className="text-gray-400 text-sm">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </SecondaryPageLayout>
  );
}
