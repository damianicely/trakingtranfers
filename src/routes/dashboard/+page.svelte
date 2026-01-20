<script lang="ts">
    let { data } = $props(); // Svelte 5 way to get data from the server
    
    const user = $derived(data.user);
    const role = $derived(user.role);
    
    const roleTitle = $derived.by(() => {
        const roleMap: Record<string, string> = {
            customer: 'Customer Dashboard',
            owner: 'Owner Dashboard',
            driver: 'Driver Dashboard',
            admin: 'Admin Dashboard'
        };
        return roleMap[role] || 'Dashboard';
    });
</script>

<div class="dashboard">
    <header class="dashboard-header">
        <h1>{roleTitle}</h1>
        <p class="welcome">Welcome back, <strong>{user.username}</strong>!</p>
        <form method="POST" action="/logout" class="logout-form">
            <button type="submit">Logout</button>
        </form>
    </header>

    <main class="dashboard-content">
        {#if role === 'customer'}
            <section class="dashboard-section">
                <h2>Your Bookings</h2>
                <p>View and manage your luggage transfer bookings.</p>
                <div class="placeholder">
                    <p>No bookings yet. <a href="/">Create a booking</a></p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>Account Information</h2>
                <dl class="info-list">
                    <dt>Username:</dt>
                    <dd>{user.username}</dd>
                    <dt>User ID:</dt>
                    <dd>{user.id}</dd>
                    <dt>Role:</dt>
                    <dd>Customer</dd>
                </dl>
            </section>
        {:else if role === 'owner'}
            <section class="dashboard-section">
                <h2>Business Overview</h2>
                <p>Manage your transfer business operations.</p>
                <div class="placeholder">
                    <p>Business dashboard coming soon</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>Bookings Management</h2>
                <p>View and manage all bookings across your business.</p>
                <div class="placeholder">
                    <p>Bookings management coming soon</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>Account Information</h2>
                <dl class="info-list">
                    <dt>Username:</dt>
                    <dd>{user.username}</dd>
                    <dt>User ID:</dt>
                    <dd>{user.id}</dd>
                    <dt>Role:</dt>
                    <dd>Owner</dd>
                </dl>
            </section>
        {:else if role === 'driver'}
            <section class="dashboard-section">
                <h2>Today's Routes</h2>
                <p>View your assigned transfer routes for today.</p>
                <div class="placeholder">
                    <p>No routes assigned today</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>Upcoming Transfers</h2>
                <p>See your scheduled transfers for the coming days.</p>
                <div class="placeholder">
                    <p>No upcoming transfers</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>Account Information</h2>
                <dl class="info-list">
                    <dt>Username:</dt>
                    <dd>{user.username}</dd>
                    <dt>User ID:</dt>
                    <dd>{user.id}</dd>
                    <dt>Role:</dt>
                    <dd>Driver</dd>
                </dl>
            </section>
        {:else if role === 'admin'}
            <section class="dashboard-section">
                <h2>System Overview</h2>
                <p>Monitor and manage the entire platform.</p>
                <div class="placeholder">
                    <p>System statistics coming soon</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>User Management</h2>
                <p>Manage users, roles, and permissions.</p>
                <div class="placeholder">
                    <p>User management coming soon</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>All Bookings</h2>
                <p>View and manage all bookings across the platform.</p>
                <div class="placeholder">
                    <p>Bookings overview coming soon</p>
                </div>
            </section>
            
            <section class="dashboard-section">
                <h2>Account Information</h2>
                <dl class="info-list">
                    <dt>Username:</dt>
                    <dd>{user.username}</dd>
                    <dt>User ID:</dt>
                    <dd>{user.id}</dd>
                    <dt>Role:</dt>
                    <dd>Administrator</dd>
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