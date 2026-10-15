"""initial_point76_schema

Revision ID: 001_initial_point76
Revises: 
Create Date: 2026-10-15 20:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_point76'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('role', sa.String(length=30), server_default='SALES_REP', nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='1', nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. customers
    op.create_table(
        'customers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('contact_person', sa.String(length=100), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('company', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customers_id'), 'customers', ['id'], unique=False)

    # 3. pipeline_stages
    op.create_table(
        'pipeline_stages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('stage_order', sa.Integer(), server_default='1', nullable=True),
        sa.Column('win_probability', sa.Integer(), server_default='0', nullable=True),
        sa.Column('is_won', sa.Boolean(), server_default='0', nullable=True),
        sa.Column('is_lost', sa.Boolean(), server_default='0', nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pipeline_stages_id'), 'pipeline_stages', ['id'], unique=False)

    # 4. win_loss_reasons
    op.create_table(
        'win_loss_reasons',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=10), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_win_loss_reasons_id'), 'win_loss_reasons', ['id'], unique=False)

    # 5. competitors
    op.create_table(
        'competitors',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_competitors_id'), 'competitors', ['id'], unique=False)

    # 6. opportunities
    op.create_table(
        'opportunities',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=True),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('expected_value', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=True),
        sa.Column('stage_id', sa.Integer(), nullable=True),
        sa.Column('probability', sa.Integer(), server_default='0', nullable=True),
        sa.Column('expected_close_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='OPEN', nullable=False),
        sa.Column('actual_close_value', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('signed_date', sa.Date(), nullable=True),
        sa.Column('win_reason_id', sa.Integer(), nullable=True),
        sa.Column('lost_reason', sa.String(length=255), nullable=True),
        sa.Column('lost_reason_detail', sa.Text(), nullable=True),
        sa.Column('winning_competitor', sa.String(length=255), nullable=True),
        sa.Column('close_note', sa.Text(), nullable=True),
        sa.Column('closed_by_id', sa.Integer(), nullable=True),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.Column('version', sa.Integer(), server_default='1', nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['closed_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['stage_id'], ['pipeline_stages.id'], ),
        sa.ForeignKeyConstraint(['win_reason_id'], ['win_loss_reasons.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_opportunities_id'), 'opportunities', ['id'], unique=False)
    op.create_index(op.f('ix_opportunities_name'), 'opportunities', ['name'], unique=False)
    op.create_index(op.f('ix_opportunities_status'), 'opportunities', ['status'], unique=False)

    # 7. opportunity_history
    op.create_table(
        'opportunity_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('opportunity_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('old_status', sa.String(length=20), nullable=True),
        sa.Column('new_status', sa.String(length=20), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('changed_by_id', sa.Integer(), nullable=True),
        sa.Column('changed_by_name', sa.String(length=100), nullable=False),
        sa.Column('changed_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('metadata_json', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], ),
        sa.ForeignKeyConstraint(['changed_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_opportunity_history_id'), 'opportunity_history', ['id'], unique=False)

    # 8. sales_target_transactions
    op.create_table(
        'sales_target_transactions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('opportunity_id', sa.Integer(), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('transaction_type', sa.String(length=30), nullable=False),
        sa.Column('idempotency_key', sa.String(length=120), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], ),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('idempotency_key', name='uq_sales_target_idempotency')
    )
    op.create_index(op.f('ix_sales_target_transactions_id'), 'sales_target_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_sales_target_transactions_idempotency_key'), 'sales_target_transactions', ['idempotency_key'], unique=True)

def downgrade() -> None:
    op.drop_table('sales_target_transactions')
    op.drop_table('opportunity_history')
    op.drop_table('opportunities')
    op.drop_table('competitors')
    op.drop_table('win_loss_reasons')
    op.drop_table('pipeline_stages')
    op.drop_table('customers')
    op.drop_table('users')
