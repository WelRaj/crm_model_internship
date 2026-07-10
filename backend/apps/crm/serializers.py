from rest_framework import serializers

from apps.accounts.serializers import UserSummarySerializer
from apps.crm.models import Lead
from apps.crm.selectors import find_duplicate_leads


class LeadSerializer(serializers.ModelSerializer):
    assigned_to = UserSummarySerializer(read_only=True)

    class Meta:
        model = Lead
        fields = (
            "id",
            "lead_number",
            "lead_type",
            "status",
            "source",
            "company_name",
            "contact_name",
            "email",
            "mobile",
            "city",
            "requirement_summary",
            "estimated_value",
            "assigned_to",
            "created_at",
            "updated_at",
        )


class LeadCreateSerializer(serializers.Serializer):
    lead_type = serializers.ChoiceField(choices=Lead.LeadType.choices, default=Lead.LeadType.PROJECT)
    source = serializers.CharField(max_length=80, required=False, allow_blank=True)
    company_name = serializers.CharField(max_length=180, required=False, allow_blank=True)
    contact_name = serializers.CharField(max_length=160)
    email = serializers.EmailField(required=False, allow_blank=True)
    mobile = serializers.CharField(max_length=20)
    city = serializers.CharField(max_length=120, required=False, allow_blank=True)
    requirement_summary = serializers.CharField(required=False, allow_blank=True)
    estimated_value = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)

    def validate_mobile(self, value):
        digits = "".join(char for char in value if char.isdigit())
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        if len(digits) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number.")
        return digits

    def validate_email(self, value):
        return value.lower() if value else ""

    def validate(self, attrs):
        duplicates = find_duplicate_leads(
            mobile=attrs["mobile"],
            email=attrs.get("email", ""),
            company_name=attrs.get("company_name", ""),
        )
        if duplicates.exists():
            raise serializers.ValidationError({"duplicate": "Lead already exists with same mobile, email, or company."})
        return attrs

