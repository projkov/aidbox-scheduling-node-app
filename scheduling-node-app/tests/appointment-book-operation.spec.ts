import { isSuccess, RemoteDataResult } from 'aidbox-react/lib/libs/remoteData';
import { getReference } from 'aidbox-react/lib/services/fhir';
import { service } from 'aidbox-react/lib/services/service';
import { withRootAccess } from 'aidbox-react/lib/utils/tests';

import { Appointment, Bundle } from 'shared/src/contrib/aidbox';
import {
  createHealthcareService,
  createOrganization,
  createPatient,
  createPractitioner,
  createPractitionerRole,
} from 'shared/src/utils/tests';

async function removeRD<S = any, F = any>(promise: Promise<RemoteDataResult<S, F>>) {
  const result = await promise;
  if (isSuccess(result)) {
    return result.data;
  }

  throw result.error;
}

async function setup() {
  return await withRootAccess(async () => {
    const organization = await createOrganization();
    const hs1 = await createHealthcareService({
      merge: { providedBy: getReference(organization) },
    });
    const hs2 = await createHealthcareService({
      merge: {
        type: [
          {
            text: 'ECG',
            coding: [
              {
                code: 'ecg',
                system: 'urn:appointment-type:c8h',
                display: 'ECG',
              },
            ],
          },
        ],
      },
    });
    const patient = await createPatient();
    const practitioner = await createPractitioner();

    const practitionerRole = await createPractitionerRole({
      merge: {
        organization: getReference(organization),
        practitioner: getReference(practitioner),
        healthcareService: [getReference(hs1)],
        availableTime: [
          { daysOfWeek: ['mon'], availableStartTime: '08:00:00', availableEndTime: '12:00:00' },
        ],
      },
    });

    return { practitioner, practitionerRole, patient, hs1, hs2 };
  });
}

test('Appointment book operation creates an appointment with filled attrs', async () => {
  const { practitionerRole, hs2, patient } = await setup();
  const appointmentData: Appointment = {
    resourceType: 'Appointment',
    participant: [
      {
        actor: getReference(practitionerRole),
        status: 'accepted',
      },
      {
        actor: getReference(patient),
        status: 'accepted',
      },
      {
        actor: getReference(hs2),
        status: 'accepted',
      },
    ],
    start: '2021-10-01T10:00:00Z',
    status: 'proposed',
  };
  const dataBundle: Bundle<Appointment> = {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: [{ resource: appointmentData }],
  };

  const appointment = await withRootAccess(() =>
    removeRD(
      service<Appointment>({
        url: '/Appointment/$book',
        method: 'POST',
        data: dataBundle,
      }),
    ),
  );

  expect(appointment.id).toBeDefined();
  expect(appointment.end).toBe('2021-10-01T10:45:00Z');
  expect(
    appointment.participant.filter(({ actor }) => actor?.resourceType === 'HealthcareService')
      .length,
  ).toEqual(1);
  expect(
    appointment.participant.find(({ actor }) => actor?.resourceType === 'HealthcareService'),
  ).toMatchObject({ actor: getReference(hs2) });
});
