'use strict';

/*
 * MMS Sports Center Administration
 *
 * Member information is loaded directly from Firestore.
 * Firestore is the source of truth for users/membership status.
 */

const MMS_ADMIN = (() => {

  const BOOKINGS_KEY =
    'mms-bookings-v1';

  const ORDERS_KEY =
    'mms-orders-v1';

  const FREEZE_KEY =
    'mms-freeze-requests-v1';

  const read = key => {
    try {
      return (
        JSON.parse(
          localStorage.getItem(key)
        ) || []
      );
    } catch {
      return [];
    }
  };

  const write = (
    key,
    value
  ) => {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  };

  const requireAdmin = () => {

    if (!MMS_AUTH.currentUser()) {

      location.href =
        '../login.html?required=1';

      return false;
    }

    if (!MMS_AUTH.isAdmin()) {

      location.href =
        '../member/dashboard.html';

      return false;
    }

    return true;
  };

  const users = () =>
    MMS_AUTH.allUsers();

  const bookings = () =>
    read(BOOKINGS_KEY);

  const orders = () =>
    read(ORDERS_KEY);

  const freezes = () =>
    read(FREEZE_KEY);


  function setBookingStatus(
    id,
    status
  ) {

    const all =
      bookings();

    const index =
      all.findIndex(
        item => item.id === id
      );

    if (index < 0) {
      throw new Error(
        'Booking not found.'
      );
    }

    all[index] = {
      ...all[index],
      status,
      updatedAt:
        new Date().toISOString()
    };

    write(
      BOOKINGS_KEY,
      all
    );
  }


  function setOrderStatus(
    id,
    status
  ) {

    const all =
      orders();

    const index =
      all.findIndex(
        item => item.id === id
      );

    if (index < 0) {
      throw new Error(
        'Order not found.'
      );
    }

    all[index] = {
      ...all[index],
      status,
      updatedAt:
        new Date().toISOString()
    };

    write(
      ORDERS_KEY,
      all
    );
  }


  function setFreezeStatus(
    id,
    status
  ) {

    const all =
      freezes();

    const index =
      all.findIndex(
        item => item.id === id
      );

    if (index < 0) {
      throw new Error(
        'Request not found.'
      );
    }

    all[index] = {
      ...all[index],
      status,
      reviewedAt:
        new Date().toISOString()
    };

    write(
      FREEZE_KEY,
      all
    );
  }


  return {
    requireAdmin,
    users,
    bookings,
    orders,
    freezes,
    setBookingStatus,
    setOrderStatus,
    setFreezeStatus
  };

})();

window.MMS_ADMIN =
  MMS_ADMIN;


/* =========================================================
   ESCAPE HTML
   ========================================================= */

const esc = value =>
  String(value ?? '')
    .replace(
      /[&<>"']/g,
      character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[character])
    );


/* =========================================================
   DATE HELPERS
   ========================================================= */

function toDate(value) {

  if (!value) {
    return null;
  }

  try {

    if (
      typeof value.toDate ===
      'function'
    ) {
      return value.toDate();
    }

    if (
      typeof value ===
        'object' &&
      typeof value.seconds ===
        'number'
    ) {
      return new Date(
        value.seconds * 1000
      );
    }

    if (
      value instanceof Date
    ) {
      return value;
    }

    const converted =
      new Date(value);

    if (
      Number.isNaN(
        converted.getTime()
      )
    ) {
      return null;
    }

    return converted;

  } catch (_) {
    return null;
  }
}

function formatDate(value) {

  const date =
    toDate(value);

  if (!date) {
    return '—';
  }

  return date.toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  );
}

function formatDateTime(value) {

  const date =
    toDate(value);

  if (!date) {
    return '—';
  }

  return date.toLocaleString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}

function getMemberJoinDate(user) {
  return (
    user?.createdAt ||
    user?.joinedAt ||
    null
  );
}


/* =========================================================
   UI HELPERS
   ========================================================= */

const show = (
  element,
  text,
  error = false
) => {

  if (!element) return;

  element.textContent =
    text;

  element.className =
    `form-message ${
      error
        ? 'error'
        : 'success'
    }`;
};


const userName = id => {

  const user =
    MMS_ADMIN
      .users()
      .find(
        item =>
          item.id === id ||
          item.uid === id
      );

  return (
    user?.name ||
    'Unknown member'
  );
};


/* =========================================================
   ADMIN ACCESS
   ========================================================= */

function initAdminShell() {

  if (
    !MMS_ADMIN.requireAdmin()
  ) {
    return false;
  }

  const user =
    MMS_AUTH.currentUser();

  document
    .querySelectorAll(
      '[data-admin-name]'
    )
    .forEach(
      element => {
        element.textContent =
          user?.name ||
          'Administrator';
      }
    );

  document
    .querySelectorAll(
      '[data-admin-logout]'
    )
    .forEach(
      element => {
        element.onclick =
          MMS_AUTH.logout;
      }
    );

  return true;
}


/* =========================================================
   FIRESTORE USERS
   ========================================================= */

async function refreshUsers() {

  try {

    await MMS_AUTH
      .loadAllUsers();

    return true;

  } catch (error) {

    console.error(
      'Unable to refresh users:',
      error
    );

    show(
      document.getElementById(
        'admin-message'
      ),
      error.message ||
        'Unable to load members from Firestore.',
      true
    );

    return false;
  }
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function dashboard() {

  const stats =
    document.getElementById(
      'admin-stats'
    );

  if (!stats) {
    return;
  }

  const users =
    MMS_ADMIN.users();

  const bookingList =
    MMS_ADMIN.bookings();

  const orderList =
    MMS_ADMIN.orders();

  const freezeList =
    MMS_ADMIN.freezes();


  const values = {

    members:
      users.filter(
        user =>
          user.role === 'member'
      ).length,

    bookings:
      bookingList.filter(
        booking =>
          booking.status ===
          'Confirmed'
      ).length,

    orders:
      orderList.filter(
        order =>
          order.status ===
          'Pending collection'
      ).length,

    freezes:
      freezeList.filter(
        freeze =>
          freeze.status ===
          'Pending'
      ).length
  };


  Object.entries(
    values
  ).forEach(
    ([key, value]) => {

      const element =
        document.querySelector(
          `[data-stat="${key}"]`
        );

      if (element) {
        element.textContent =
          value;
      }
    }
  );
}


/* =========================================================
   MEMBERS
   ========================================================= */

function members() {

  const body =
    document.getElementById(
      'members-body'
    );

  if (!body) {
    return;
  }


  const draw = () => {

    const memberList =
      MMS_ADMIN
        .users()
        .filter(
          user =>
            user.role ===
            'member'
        );


    if (
      !memberList.length
    ) {

      body.innerHTML =
        `
        <tr>
          <td colspan="4">
            No members registered.
          </td>
        </tr>
        `;

      return;
    }


    body.innerHTML =
      memberList
        .map(
          user => {

            const joinedDate =
              getMemberJoinDate(
                user
              );

            const status =
              user.membershipStatus ||
              'Pending';

            const userId =
              user.id ||
              user.uid;


            return `

              <tr>

                <td>

                  <strong>
                    ${esc(
                      user.name ||
                      'Unnamed member'
                    )}
                  </strong>

                  <br>

                  <small>
                    ${esc(
                      user.email
                    )}
                  </small>

                </td>


                <td>
                  ${esc(
                    user.plan ||
                    '—'
                  )}
                </td>


                <td>

                  <select
                    data-member-status="${esc(
                      userId
                    )}"
                    aria-label="Membership status for ${esc(
                      user.name ||
                      user.email
                    )}"
                  >

                    <option
                      value="Pending"
                      ${
                        status ===
                        'Pending'
                          ? 'selected'
                          : ''
                      }
                    >
                      Pending
                    </option>

                    <option
                      value="Active"
                      ${
                        status ===
                        'Active'
                          ? 'selected'
                          : ''
                      }
                    >
                      Active
                    </option>

                    <option
                      value="Frozen"
                      ${
                        status ===
                        'Frozen'
                          ? 'selected'
                          : ''
                      }
                    >
                      Frozen
                    </option>

                    <option
                      value="Cancelled"
                      ${
                        status ===
                        'Cancelled'
                          ? 'selected'
                          : ''
                      }
                    >
                      Cancelled
                    </option>

                  </select>

                </td>


                <td>
                  ${formatDate(
                    joinedDate
                  )}
                </td>

              </tr>

            `;
          }
        )
        .join('');
  };


  body.onchange =
    async event => {

      const select =
        event.target;

      const userId =
        select.dataset.memberStatus;

      if (!userId) {
        return;
      }

      const newStatus =
        select.value;

      const message =
        document.getElementById(
          'admin-message'
        );

      select.disabled =
        true;

      try {

        show(
          message,
          'Saving membership status…'
        );


        const updated =
          await MMS_AUTH
            .updateUserByAdmin(
              userId,
              {
                membershipStatus:
                  newStatus
              }
            );


        if (
          !updated ||
          updated.membershipStatus !==
            newStatus
        ) {

          throw new Error(
            'The saved Firestore status could not be verified.'
          );
        }


        /*
         * Reload ALL users directly from Firestore.
         */
        await refreshUsers();

        /*
         * Render from fresh Firestore data.
         */
        draw();

        dashboard();


        show(
          message,
          `Membership status changed to ${newStatus} successfully.`
        );


      } catch (error) {

        console.error(
          'Membership status update failed:',
          error
        );


        /*
         * Reload actual Firestore data so the dropdown
         * does not pretend the failed value was saved.
         */
        await refreshUsers();

        draw();


        show(
          message,
          error?.message ||
            'Unable to update membership status.',
          true
        );

      } finally {

        /*
         * draw() may have replaced the select,
         * so no need to rely on the old DOM node.
         */
      }
    };


  draw();
}


/* =========================================================
   BOOKINGS
   ========================================================= */

function bookings() {

  const body =
    document.getElementById(
      'bookings-body'
    );

  if (!body) {
    return;
  }


  const draw = () => {

    const list =
      MMS_ADMIN.bookings();


    if (!list.length) {

      body.innerHTML =
        `
        <tr>
          <td colspan="4">
            No bookings found.
          </td>
        </tr>
        `;

      return;
    }


    body.innerHTML =
      list
        .map(
          booking => {

            const session =
              window.MMS_BOOKINGS &&
              typeof MMS_BOOKINGS
                .sessionById ===
              'function'
                ? MMS_BOOKINGS
                    .sessionById(
                      booking.sessionId
                    )
                : null;


            return `

              <tr>

                <td>
                  ${esc(
                    userName(
                      booking.userId
                    )
                  )}
                </td>

                <td>
                  ${esc(
                    session?.title ||
                    booking.sessionId ||
                    '—'
                  )}
                </td>

                <td>
                  ${esc(
                    session
                      ? `${session.day} ${session.time}`
                      : '—'
                  )}
                </td>

                <td>

                  <select
                    data-booking-status="${esc(
                      booking.id
                    )}"
                  >

                    <option
                      value="Confirmed"
                      ${
                        booking.status ===
                        'Confirmed'
                          ? 'selected'
                          : ''
                      }
                    >
                      Confirmed
                    </option>

                    <option
                      value="Cancelled"
                      ${
                        booking.status ===
                        'Cancelled'
                          ? 'selected'
                          : ''
                      }
                    >
                      Cancelled
                    </option>

                  </select>

                </td>

              </tr>
            `;
          }
        )
        .join('');
  };


  body.onchange =
    event => {

      const id =
        event.target.dataset
          .bookingStatus;

      if (!id) return;

      try {

        MMS_ADMIN
          .setBookingStatus(
            id,
            event.target.value
          );

        draw();

        show(
          document.getElementById(
            'admin-message'
          ),
          'Booking status updated.'
        );

      } catch (error) {

        show(
          document.getElementById(
            'admin-message'
          ),
          error.message,
          true
        );
      }
    };


  draw();
}


/* =========================================================
   ORDERS
   ========================================================= */

function orders() {

  const body =
    document.getElementById(
      'orders-body'
    );

  if (!body) return;


  const draw = () => {

    const list =
      MMS_ADMIN.orders();


    if (!list.length) {

      body.innerHTML =
        `
        <tr>
          <td colspan="4">
            No orders found.
          </td>
        </tr>
        `;

      return;
    }


    body.innerHTML =
      list
        .map(
          order => `

            <tr>

              <td>

                <strong>
                  ${esc(
                    order.id
                  )}
                </strong>

                <br>

                <small>
                  ${formatDateTime(
                    order.createdAt
                  )}
                </small>

              </td>


              <td>
                ${esc(
                  userName(
                    order.userId
                  )
                )}
              </td>


              <td>
                £${Number(
                  order.total || 0
                ).toFixed(2)}
              </td>


              <td>

                <select
                  data-order-status="${esc(
                    order.id
                  )}"
                >

                  <option
                    value="Pending collection"
                    ${
                      order.status ===
                      'Pending collection'
                        ? 'selected'
                        : ''
                    }
                  >
                    Pending collection
                  </option>

                  <option
                    value="Ready for collection"
                    ${
                      order.status ===
                      'Ready for collection'
                        ? 'selected'
                        : ''
                    }
                  >
                    Ready for collection
                  </option>

                  <option
                    value="Collected"
                    ${
                      order.status ===
                      'Collected'
                        ? 'selected'
                        : ''
                    }
                  >
                    Collected
                  </option>

                  <option
                    value="Cancelled"
                    ${
                      order.status ===
                      'Cancelled'
                        ? 'selected'
                        : ''
                    }
                  >
                    Cancelled
                  </option>

                </select>

              </td>

            </tr>
          `
        )
        .join('');
  };


  body.onchange =
    event => {

      const id =
        event.target.dataset
          .orderStatus;

      if (!id) return;

      try {

        MMS_ADMIN
          .setOrderStatus(
            id,
            event.target.value
          );

        draw();

        show(
          document.getElementById(
            'admin-message'
          ),
          'Order status updated.'
        );

      } catch (error) {

        show(
          document.getElementById(
            'admin-message'
          ),
          error.message,
          true
        );
      }
    };


  draw();
}


/* =========================================================
   FREEZE REQUESTS
   ========================================================= */

function freezes() {

  const body =
    document.getElementById(
      'freezes-body'
    );

  if (!body) return;


  const draw = () => {

    const list =
      MMS_ADMIN.freezes();


    if (!list.length) {

      body.innerHTML =
        `
        <tr>
          <td colspan="4">
            No freeze requests found.
          </td>
        </tr>
        `;

      return;
    }


    body.innerHTML =
      list
        .map(
          freeze => `

            <tr>

              <td>
                ${esc(
                  userName(
                    freeze.userId
                  )
                )}
              </td>


              <td>
                ${esc(
                  freeze.startDate
                )}
                to
                ${esc(
                  freeze.endDate
                )}
              </td>


              <td>
                ${esc(
                  freeze.reason ||
                  'Not supplied'
                )}
              </td>


              <td>

                <select
                  data-freeze-status="${esc(
                    freeze.id
                  )}"
                >

                  <option
                    value="Pending"
                    ${
                      freeze.status ===
                      'Pending'
                        ? 'selected'
                        : ''
                    }
                  >
                    Pending
                  </option>

                  <option
                    value="Approved"
                    ${
                      freeze.status ===
                      'Approved'
                        ? 'selected'
                        : ''
                    }
                  >
                    Approved
                  </option>

                  <option
                    value="Rejected"
                    ${
                      freeze.status ===
                      'Rejected'
                        ? 'selected'
                        : ''
                    }
                  >
                    Rejected
                  </option>

                  <option
                    value="Cancelled"
                    ${
                      freeze.status ===
                      'Cancelled'
                        ? 'selected'
                        : ''
                    }
                  >
                    Cancelled
                  </option>

                </select>

              </td>

            </tr>
          `
        )
        .join('');
  };


  body.onchange =
    event => {

      const id =
        event.target.dataset
          .freezeStatus;

      if (!id) return;


      try {

        MMS_ADMIN
          .setFreezeStatus(
            id,
            event.target.value
          );

        draw();

        show(
          document.getElementById(
            'admin-message'
          ),
          'Freeze request status updated.'
        );

      } catch (error) {

        show(
          document.getElementById(
            'admin-message'
          ),
          error.message,
          true
        );
      }
    };


  draw();
}


/* =========================================================
   SESSIONS
   ========================================================= */

function sessions() {

  const body =
    document.getElementById(
      'sessions-body'
    );

  if (!body) return;


  const sessionList =
    window.MMS_BOOKINGS &&
    Array.isArray(
      MMS_BOOKINGS.sessions
    )
      ? MMS_BOOKINGS.sessions
      : [];


  if (!sessionList.length) {

    body.innerHTML =
      `
      <tr>
        <td colspan="4">
          No sessions found.
        </td>
      </tr>
      `;

    return;
  }


  body.innerHTML =
    sessionList
      .map(
        session => `

          <tr>

            <td>

              <strong>
                ${esc(
                  session.title
                )}
              </strong>

              <br>

              <small>
                ${esc(
                  session.location
                )}
              </small>

            </td>


            <td>
              ${esc(
                session.sport
              )}
            </td>


            <td>
              ${esc(
                session.day
              )}
              ${esc(
                session.time
              )}
            </td>


            <td>
              ${
                typeof MMS_BOOKINGS
                  .countForSession ===
                'function'
                  ? MMS_BOOKINGS
                      .countForSession(
                        session.id
                      )
                  : 0
              }
              /
              ${session.capacity}
            </td>

          </tr>
        `
      )
      .join('');
}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    if (
      !initAdminShell()
    ) {
      return;
    }


    /*
     * IMPORTANT:
     * Load the user list directly from Firestore
     * before rendering member/admin information.
     */
    const loaded =
      await refreshUsers();


    if (!loaded) {
      return;
    }


    dashboard();

    members();

    bookings();

    orders();

    freezes();

    sessions();
  }
);