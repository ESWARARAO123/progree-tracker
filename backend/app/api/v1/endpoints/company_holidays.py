from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.user import User
from app.models.company_holiday import CompanyHoliday
from app.schemas.company_holiday import CreateCompanyHolidayRequest, CompanyHolidayResponse
from app.api.v1.endpoints.auth import get_current_user, require_admin

router = APIRouter()


@router.get("/", response_model=list[CompanyHolidayResponse])
async def list_company_holidays(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(CompanyHoliday).order_by(CompanyHoliday.date.asc()))
    holidays = result.scalars().all()
    return [
        CompanyHolidayResponse(
            id=str(h.id),
            name=h.name,
            description=h.description,
            date=h.date,
            created_by=str(h.created_by) if h.created_by else None,
            created_at=h.created_at,
        )
        for h in holidays
    ]


@router.post("/", response_model=CompanyHolidayResponse, status_code=status.HTTP_201_CREATED)
async def create_company_holiday(
    body: CreateCompanyHolidayRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    holiday = CompanyHoliday(
        name=body.name,
        description=body.description,
        date=body.date,
        created_by=admin.id,
    )
    db.add(holiday)
    await db.commit()
    await db.refresh(holiday)
    return CompanyHolidayResponse(
        id=str(holiday.id),
        name=holiday.name,
        description=holiday.description,
        date=holiday.date,
        created_by=str(holiday.created_by) if holiday.created_by else None,
        created_at=holiday.created_at,
    )


@router.delete("/{holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company_holiday(
    holiday_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(CompanyHoliday).where(CompanyHoliday.id == holiday_id))
    holiday = result.scalar_one_or_none()
    if not holiday:
        raise HTTPException(status_code=404, detail="Company holiday not found")
    await db.delete(holiday)
    await db.commit()
