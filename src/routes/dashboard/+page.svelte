<script lang="ts">
    import { language } from '$lib/stores/language';
    import { translations } from '$lib/translations';

    let { data } = $props(); // Svelte 5 way to get data from the server
    
    const user = $derived(data.user);
    const role = $derived(user.role);

    const t = $derived(translations[$language]);
    
    const roleTitle = $derived.by(() => {
        const roleMap: Record<string, string> = {
            customer: t.dashboard_title_customer,
            owner: t.dashboard_title_owner,
            driver: t.dashboard_title_driver,
            admin: t.dashboard_title_admin
        };
        return roleMap[role] || t.dashboard_title_customer;
    });
</script>

<div class="dashboard">
    <header class="dashboard-header">
        <h1>{roleTitle}</h1>
        <p class="welcome">
            {t.dashboard_welcome.replace('{username}', user.username)}
        </p>
        <form method="POST" action="/logout" class="logout-form">
            <button type="submit">{t.dashboard_logout}</button>
        </form>
    </header>

    <main class="dashboard-content">
        {#if role === 'customer'}
            <section class="dashboard-section">
                <h2>{t.dashboard_section_bookings_title}</h2>
                <p>{t.dashboard_section_bookings_description}</p>
                <div class="placeholder">
                    <p>{t.dashboard_section_bookings_empty} <a href="/">{t.dashboard_section_bookings_create_link}</a></p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>{t.dashboard_section_account_title}</h2>
                <dl class="info-list">
                    <dt>{t.dashboard_label_username}</dt>
                    <dd>{user.username}</dd>
                    <dt>{t.dashboard_label_user_id}</dt>
                    <dd>{user.id}</dd>
                    <dt>{t.dashboard_label_role}</dt>
                    <dd>{t.dashboard_role_customer}</dd>
                </dl>
            </section>
        {:else if role === 'owner'}
            <section class="dashboard-section">
                <h2>{t.dashboard_section_owner_overview_title}</h2>
                <p>{t.dashboard_section_owner_overview_description}</p>
                <div class="placeholder">
                    <p>{t.dashboard_section_owner_overview_placeholder}</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>{t.dashboard_section_owner_bookings_title}</h2>
                <p>{t.dashboard_section_owner_bookings_description}</p>
                <div class="placeholder">
                    <p>{t.dashboard_section_owner_bookings_placeholder}</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>{t.dashboard_section_account_title}</h2>
                <dl class="info-list">
                    <dt>{t.dashboard_label_username}</dt>
                    <dd>{user.username}</dd>
                    <dt>{t.dashboard_label_user_id}</dt>
                    <dd>{user.id}</dd>
                    <dt>{t.dashboard_label_role}</dt>
                    <dd>{t.dashboard_role_owner}</dd>
                </dl>
            </section>
        {:else if role === 'driver'}
            <section class="dashboard-section">
                <h2>{t.dashboard_section_driver_today_title}</h2>
                <p>{t.dashboard_section_driver_today_description}</p>
                <div class="placeholder">
                    <p>{t.dashboard_section_driver_today_placeholder}</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>{t.dashboard_section_driver_upcoming_title}</h2>
                <p>{t.dashboard_section_driver_upcoming_description}</p>
                <div class="placeholder">
                    <p>{t.dashboard_section_driver_upcoming_placeholder}</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>{t.dashboard_section_account_title}</h2>
                <dl class="info-list">
                    <dt>{t.dashboard_label_username}</dt>
                    <dd>{user.username}</dd>
                    <dt>{t.dashboard_label_user_id}</dt>
                    <dd>{user.id}</dd>
                    <dt>{t.dashboard_label_role}</dt>
                    <dd>{t.dashboard_role_driver}</dd>
                </dl>
            </section>
        {:else if role === 'admin'}
            <section class="dashboard-section">
                <h2>{t.dashboard_section_admin_overview_title}</h2>
                <p>{t.dashboard_section_admin_overview_description}</p>
                <div class="placeholder">
                    <p>{t.dashboard_section_admin_overview_placeholder}</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>{t.dashboard_section_admin_users_title}</h2>
                <p>{t.dashboard_section_admin_users_description}</p>
                <div class="placeholder">
                    <p>{t.dashboard_section_admin_users_placeholder}</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>{t.dashboard_section_admin_bookings_title}</h2>
                <p>{t.dashboard_section_admin_bookings_description}</p>
                <div class="placeholder">
                    <p>{t.dashboard_section_admin_bookings_placeholder}</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>{t.dashboard_section_account_title}</h2>
                <dl class="info-list">
                    <dt>{t.dashboard_label_username}</dt>
                    <dd>{user.username}</dd>
                    <dt>{t.dashboard_label_user_id}</dt>
                    <dd>{user.id}</dd>
                    <dt>{t.dashboard_label_role}</dt>
                    <dd>{t.dashboard_role_admin}</dd>
                </dl>
            </section>
        {/if}
    </main>
</div>

<style>
    .dashboard {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    .dashboard-header {
        margin-bottom: 3rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .dashboard-header h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 600;
        color: #1a1a1a;
    }

    .welcome {
        margin: 0.5rem 0 0 0;
        color: #666;
        font-size: 1rem;
    }

    .logout-form {
        margin: 0;
    }

    .logout-form button {
        padding: 0.5rem 1.5rem;
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.2s;
    }

    .logout-form button:hover {
        background-color: #c82333;
    }

    .dashboard-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .dashboard-section {
        background: #f9f9f9;
        padding: 1.5rem;
        border-radius: 8px;
    }

    .dashboard-section h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1a1a;
    }

    .dashboard-section > p {
        margin: 0 0 1rem 0;
        color: #666;
        font-size: 0.9rem;
    }

    .placeholder {
        padding: 2rem;
        text-align: center;
        background: white;
        border-radius: 4px;
        color: #999;
    }

    .placeholder a {
        color: #007bff;
        text-decoration: none;
    }

    .placeholder a:hover {
        text-decoration: underline;
    }

    .info-list {
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.5rem 1rem;
    }

    .info-list dt {
        font-weight: 600;
        color: #666;
    }

    .info-list dd {
        margin: 0;
        color: #1a1a1a;
    }

    @media (max-width: 768px) {
        .dashboard {
            padding: 1rem;
        }

        .dashboard-header {
            flex-direction: column;
        }

        .dashboard-content {
            grid-template-columns: 1fr;
        }
    }
</style>