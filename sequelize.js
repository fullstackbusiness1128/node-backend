// BlogTag will be our way of tracking relationship between Blog and Tag models
// each Blog can have multiple tags and each Tag can have multiple blogs
// const BlogTag = sequelize.define('blog_tag', {})
// const Tag = TagModel(sequelize, Sequelize)

// Blog.belongsToMany(Tag, { through: BlogTag, unique: false })
// Tag.belongsToMany(Blog, { through: BlogTag, unique: false })


const Sequelize = require('sequelize')
const UserModel = require('./models/user.model').model
const PosModel = require('./models/pos.model').model
const SupervisorModel = require('./models/supervisor.model').model
const BrandModel = require('./models/brand.model').model
const RoutePosModel = require('./models/routePos.model').model
const RouteUserModel = require('./models/routeUser.model').model
const StaticModel = require('./models/static.model').model
const SurveyQuestionTypeModel = require('./models/surveyQuestionType.model').model
const SurveyQuestionModel = require('./models/surveyQuestion.model').model
const SurveyModel = require('./models/survey.model').model
const FamilyModel = require('./models/family.model').model
const ProductModel = require('./models/products.model').model
const GeographyModel = require('./models/geography.model').model
const SurveyComponentModel = require('./models/surveyComponent.model').model
const SurveyComponentProductsModel = require('./models/surveyComponentProducts.model').model
const WorksessionModel = require('./models/worksession.model').model
const WorksessionPosModel = require('./models/worksessionPos.model').model
const WorksessionSurveyModel = require('./models/worksessionSurvey.model').model
const OperatorModel = require('./models/operator.model').model
const OperatorBrandModel = require('./models/operatorBrand.model').model
const WorksessionSurveyResponseModel = require('./models/worksessionSurveyResponse.model').model
const RouteModel = require('./models/route.model').model

const config = require('./config/sequelize')

const sequelize = new Sequelize(config)
const User = UserModel(sequelize, Sequelize)
const Pos = PosModel(sequelize, Sequelize)
const Supervisor = SupervisorModel(sequelize, Sequelize)
const Brand = BrandModel(sequelize, Sequelize)
const Product = ProductModel(sequelize, Sequelize)
const Static = StaticModel(sequelize, Sequelize)
const Survey = SurveyModel(sequelize, Sequelize)
const Route = RouteModel(sequelize, Sequelize)
const Family = FamilyModel(sequelize, Sequelize)
const SurveyQuestionType = SurveyQuestionTypeModel(sequelize, Sequelize)
const SurveyQuestion = SurveyQuestionModel(sequelize, Sequelize)
const SurveyComponent = SurveyComponentModel(sequelize, Sequelize)
const SurveyComponentProducts = SurveyComponentProductsModel(sequelize, Sequelize)
const Geography = GeographyModel(sequelize, Sequelize)
const RoutePos = RoutePosModel(sequelize, Sequelize)
const RouteUser = RouteUserModel(sequelize, Sequelize)
const Worksession = WorksessionModel(sequelize, Sequelize)
const WorksessionPos = WorksessionPosModel(sequelize, Sequelize)
const WorksessionSurvey = WorksessionSurveyModel(sequelize, Sequelize)
const WorksessionSurveyResponse = WorksessionSurveyResponseModel(sequelize, Sequelize)
const Operator = OperatorModel(sequelize, Sequelize)
const OperatorBrand = OperatorBrandModel(sequelize, Sequelize)

const Products_sub_brands = require('./models/products_sub_brands')(sequelize, Sequelize)
const Products_sub_families = require('./models/products_sub_families')(sequelize, Sequelize)
const Assortment = require('./models/assortment')(sequelize, Sequelize)
const Pro_sub_brands = require('./models/pro_sub_brands')(sequelize, Sequelize)
const Pro_sub_families = require('./models/pro_sub_families')(sequelize, Sequelize)
const SubBrands = require('./models/subbrands')(sequelize, Sequelize)
const Chain = require('./models/chain')(sequelize, Sequelize)
const Channel = require('./models/channel')(sequelize, Sequelize)
const Zone = require('./models/zone')(sequelize, Sequelize)
const BrandZones = require('./models/brand_zone')(sequelize, Sequelize)
const AssortmentPos = require('./models/assortment_pos')(sequelize, Sequelize)
const Objective = require('./models/objective')(sequelize, Sequelize)
const ObjectiveAccomplishmentScales = require('./models/objective_accomplishment_scales')(sequelize, Sequelize)
const ObjectivePos = require('./models/objective_pos')(sequelize, Sequelize)
const ObjectiveRoutes = require('./models/objective_routes')(sequelize, Sequelize)
const ZoneGeography = require('./models/zone_geography')(sequelize, Sequelize)
const AssortmentProduct = require('./models/assortment_product')(sequelize, Sequelize)

const ExpenseType = require('./models/expense_type')(sequelize, Sequelize)
const ExpenseKilometer = require('./models/expense_kilometer')(sequelize, Sequelize)
const ExpenseOther = require('./models/expense_other')(sequelize, Sequelize)
const Liquidation = require('./models/liquidation')(sequelize, Sequelize)

const HolidayModel = require('./models/holiday').model
const Holiday = HolidayModel(sequelize, Sequelize)
const Holidaypublic = require('./models/holidaypublic')(sequelize, Sequelize)
const LeaveModel = require('./models/leave').model
const Leave = LeaveModel(sequelize, Sequelize)
const Leavepublic = require('./models/leavepublics')(sequelize, Sequelize)
const WorkdayModel = require('./models/workday').model
const Workday = WorkdayModel(sequelize, Sequelize)
const EmaillogsModel = require('./models/emaillogs').model
const Emaillogs = EmaillogsModel(sequelize, Sequelize)
const UsersProjectsModel = require('./models/users_projects').model
const UsersProjects = UsersProjectsModel(sequelize, Sequelize)
const CompanyModel = require('./models/company').model
const Company = CompanyModel(sequelize, Sequelize)
const StaticpendingholidaysModel = require('./models/staticpendingholidays').model
const Staticpendingholidays = StaticpendingholidaysModel(sequelize, Sequelize)
const HolidaystaticdaysModel = require('./models/holidaystaticdays').model
const Holidaystaticdays = HolidaystaticdaysModel(sequelize, Sequelize)
const HolidaypaiddayslimitModel = require('./models/holidaypaiddayslimit').model
const Holidaypaiddayslimit = HolidaypaiddayslimitModel(sequelize, Sequelize)

const PostaglabelModel = require('./models/postaglabel').model
const Postaglabel = PostaglabelModel(sequelize, Sequelize)
const PostagsModel = require('./models/pos_tags').model
const Postags = PostagsModel(sequelize, Sequelize)
const PosbrandsModel = require('./models/posbrands').model
const Posbrands = PosbrandsModel(sequelize, Sequelize)

const WorksessionadditionalposModel = require('./models/worksessionadditionalpos').model
const Worksessionadditionalpos = WorksessionadditionalposModel(sequelize, Sequelize)
const WorksessionposbrandModel = require('./models/worksessionposbrand').model
const Worksessionposbrand = WorksessionposbrandModel(sequelize, Sequelize)

const RoutepossurveyModel = require('./models/routepossurvey').model
const RoutePosSurvey = RoutepossurveyModel(sequelize, Sequelize)

const BrandOnePageModel = require('./models/brandonepage').model
const BrandOnePage = BrandOnePageModel(sequelize, Sequelize)
const BrandOnepagePosModel = require('./models/brandonepagepos').model
const BrandOnepagePos = BrandOnepagePosModel(sequelize, Sequelize)
const BrandPromosModel = require('./models/brandpromos').model
const BrandPromos = BrandPromosModel(sequelize, Sequelize)
const BrandPromosPosModel = require('./models/brandpromospos').model
const BrandPromosPos = BrandPromosPosModel(sequelize, Sequelize)

const RoutePosInactiveModel = require('./models/route_pos_inactive').model
const RoutePosInactive = RoutePosInactiveModel(sequelize, Sequelize)
const RoutePosInactiveBrandsModel = require('./models/route_pos_inactive_brands').model
const RoutePosInactiveBrands = RoutePosInactiveBrandsModel(sequelize, Sequelize)

const RoutePosRequestVisitdayModel = require('./models/route_pos_request_visitday').model
const RoutePosRequestVisitday = RoutePosRequestVisitdayModel(sequelize, Sequelize)
const RoutePosRequestVisitdayBrandsModel = require('./models/route_pos_request_visitday_brands').model
const RoutePosRequestVisitdayBrands = RoutePosRequestVisitdayBrandsModel(sequelize, Sequelize)

const PosAttachmentModel = require('./models/pos_attachment').model
const PosAttachment = PosAttachmentModel(sequelize, Sequelize)
const PosNewRequestModel = require('./models/pos_new_request').model
const PosNewRequest = PosNewRequestModel(sequelize, Sequelize)
const PosNewRequestBrandsModel = require('./models/pos_new_request_brands').model
const PosNewRequestBrands = PosNewRequestBrandsModel(sequelize, Sequelize)

const formatJSON = (value, initial) => {
    return JSON.stringify({ value, initial })
}

/********** START - Should check it. we don't need it. **********/
//Brand-Survey
Brand.hasMany(Survey, {
    foreignKey: 'brandId',
    onDelete: 'restrict'
});

Survey.belongsTo(Brand, {
    foreignKey: 'brandId'
});
/********** END - Should check it. we don't need it. **********/

//Survey - SurveyComponent 1:N
Survey.hasMany(SurveyComponent, {
    foreignKey: 'surveyId'
});

//SurveyComponent - SurveyQuestion 1:N
SurveyComponent.hasMany(SurveyQuestion, {
    foreignKey: 'componentId'
});

SurveyQuestion.belongsTo(SurveyQuestionType, {
    foreignKey: 'type'
});

//SurveyQuestion - Type 1:N
SurveyQuestionType.hasMany(SurveyQuestion, {
    foreignKey: 'type'
});

//SurveyComponent - Product N:N
Product.belongsToMany(SurveyComponent, {
    through: SurveyComponentProducts,
    foreignKey: 'productId',
    otherKey: 'componentId'
})

SurveyComponent.belongsToMany(Product, {
    through: SurveyComponentProducts,
    foreignKey: 'componentId',
    otherKey: 'productId'
})


//Brand-Static: 1:1
Brand.belongsTo(Static, {
    foreignKey: 'imageId'
});

Static.hasOne(Brand, {
    foreignKey: 'imageId',
});

//SurveyComponent-Static: 1:1
SurveyComponent.belongsTo(Static, {
    foreignKey: 'imageId'
});

Static.hasOne(SurveyComponent, {
    foreignKey: 'imageId',
});

//SurveyQuestion-Static: 1:1
SurveyQuestion.belongsTo(Static, {
    foreignKey: 'imageId'
});

Static.hasOne(SurveyQuestion, {
    foreignKey: 'imageId',
});

//Product Brand 1:N
Brand.hasMany(Product, {
    foreignKey: 'brandId'
});


// RoutePos.belongsTo(Survey, {
//     foreignKey: 'surveyId'
// })

// Survey.hasMany(RoutePos, {
//     foreignKey: 'surveyId'
// })

RoutePos.belongsToMany(Survey, {
    through: RoutePosSurvey,
    foreignKey: 'routePosId',
    otherKey: 'surveyId'
});
Survey.belongsToMany(RoutePos, {
    through: RoutePosSurvey,
    foreignKey: 'surveyId',
    otherKey: 'routePosId'
});

RoutePos.belongsTo(Brand, {
    foreignKey: 'brandId'
})

Brand.hasMany(RoutePos, {
    foreignKey: 'brandId'
})


RoutePos.belongsTo(Pos, {
    foreignKey: 'posId'
})

Pos.hasMany(RoutePos, {
    foreignKey: 'posId'
})


RoutePos.belongsTo(Route, {
    foreignKey: 'routeId'
})


OperatorBrand.belongsTo(Operator, {
    foreignKey: 'operatorId'
})

OperatorBrand.belongsTo(Brand, {
    foreignKey: 'brandId'
})

OperatorBrand.belongsTo(Pos, {
    foreignKey: 'posId'
})



Product.belongsTo(Brand, {
    foreignKey: 'brandId'
});

//Family Product 1:N
Family.hasMany(Product, {
    foreignKey: 'familyId'
});

Product.belongsTo(Family, {
    foreignKey: 'familyId'
});



//Family Brand 1:N
Brand.hasMany(Family, {
    foreignKey: 'brandId'
});

Family.belongsTo(Brand, {
    foreignKey: 'brandId'
});

// Parent relation
Family.hasMany(Family, {
    as: "children",
    foreignKey: "parentId"
});

Family.belongsTo(Family, {
    as: "parent"
});

User.belongsToMany(User, {
    as: 'gpvs',
    through: Supervisor,
    foreignKey: 'supervisorId'
});

User.belongsToMany(User, {
    as: 'instructedBy',
    through: Supervisor,
    foreignKey: 'gpvId'
});

Geography.belongsTo(Geography, {
    as: "parent"
});

Geography.hasMany(Geography, {
    as: "children",
    foreignKey: "parentId"
});

Geography.hasMany(Pos, {
    foreignKey: "geographyId"
});

Geography.hasMany(Route, {
    foreignKey: "geographyId"
});


//Route User N:N
// Route.belongsToMany(User, {
//     through: RouteUser,
//     foreignKey: 'routeId',
//     otherKey: 'userId'
// });
User.belongsToMany(Route, { through: RouteUser });
Route.belongsToMany(User, { through: RouteUser });

Worksession.belongsTo(User, {
    foreignKey: 'userId'
});

Worksession.belongsTo(Static, {
    foreignKey: 'kmsPhotoId'
});

// WorksessionPos.hasMany(WorksessionSurvey, {
//     foreignKey: 'worksessionPosId',
// });

// WorksessionSurvey.belongsTo(WorksessionPos, {
//     foreignKey: 'worksessionPosId'
// });

Worksessionposbrand.hasMany(WorksessionSurvey, {
    foreignKey: 'worksessionPosBrandId',
});

WorksessionSurvey.belongsTo(Worksessionposbrand, {
    foreignKey: 'worksessionPosBrandId'
});

Survey.hasMany(WorksessionSurvey, {
    foreignKey: 'surveyId',
});

WorksessionSurvey.belongsTo(Survey, {
    foreignKey: 'surveyId'
});

Worksession.hasMany(WorksessionPos, {
    foreignKey: 'worksessionId'
});

WorksessionPos.belongsTo(Worksession, {
    foreignKey: 'worksessionId'
});

WorksessionPos.belongsTo(Pos, {
    foreignKey: 'posId'
});

Route.hasMany(WorksessionPos, {
    foreignKey: 'routeId'
});

WorksessionPos.belongsTo(Route, {
    foreignKey: 'routeId'
});

// Brand.hasMany(WorksessionPos, {
//     foreignKey: 'brandId'
// });

// WorksessionPos.belongsTo(Brand, {
//     foreignKey: 'brandId'
// });

WorksessionSurvey.hasMany(WorksessionSurveyResponse, {
    foreignKey: 'worksessionSurveyId'
});

WorksessionSurveyResponse.belongsTo(WorksessionSurvey, {
    foreignKey: 'worksessionSurveyId'
})

SurveyQuestion.hasOne(WorksessionSurveyResponse, {
    foreignKey: 'surveyQuestionId',
});

WorksessionSurveyResponse.belongsTo(Product, {
    foreignKey: 'productId'
})

Product.hasOne(WorksessionSurveyResponse, {
    foreignKey: 'productId',
});

User.belongsTo(User, {
    as: "Parent",
    foreignKey: "parent_id"
});
User.hasMany(User, {
    as: "Children",
    foreignKey: "parent_id"
});

// products && brands && families
//Brand - Product N:N
Brand.belongsToMany(Product, {
    through: Products_sub_brands,
    foreignKey: 'brand_id',
    otherKey: 'pro_id'
})
Product.belongsToMany(Brand, {
    through: Products_sub_brands,
    foreignKey: 'pro_id',
    otherKey: 'brand_id'
})
Brand.belongsToMany(Product, {
    through: Products_sub_brands,
    foreignKey: 'parent_brand_id',
    otherKey: 'pro_id'
})
Product.belongsToMany(Brand, {
    through: Products_sub_brands,
    foreignKey: 'pro_id',
    otherKey: 'parent_brand_id'
})
//Family - Product N:N
Family.belongsToMany(Product, {
    through: Products_sub_families,
    foreignKey: 'family_id',
    otherKey: 'pro_id'
})
Product.belongsToMany(Family, {
    through: Products_sub_families,
    foreignKey: 'pro_id',
    otherKey: 'family_id'
})
Family.belongsToMany(Product, {
    through: Products_sub_families,
    foreignKey: 'parent_family_id',
    otherKey: 'pro_id'
})
Product.belongsToMany(Family, {
    through: Products_sub_families,
    foreignKey: 'pro_id',
    otherKey: 'parent_family_id'
})

//Brand-Static: 1:1
Product.belongsTo(Static, {
    foreignKey: 'photos'
});

Static.hasOne(Product, {
    foreignKey: 'photos',
});

// Assortment
Brand.hasMany(Assortment, {
    foreignKey: "brand_id",
});
Assortment.belongsTo(Brand, {
    foreignKey: 'brand_id',
});
// Product.hasMany(Assortment, {
//     foreignKey: "product_id",
// });
// Assortment.belongsTo(Product, {
//     foreignKey: 'product_id',
// });
Operator.hasMany(Assortment, {
    foreignKey: "operator_id",
});
Assortment.belongsTo(Operator, {
    foreignKey: 'operator_id',
});

// Brand parent and sub-brand
Brand.hasMany(Brand, {
    as: "children",
    foreignKey: "parentId"
});
Brand.belongsTo(Brand, {
    as: "parent"
});

//SubBrands Brand 1:N
Brand.hasMany(SubBrands, {
    foreignKey: 'brandId'
});
SubBrands.belongsTo(Brand, {
    foreignKey: 'brandId'
});
// Parent relation
SubBrands.hasMany(SubBrands, {
    as: "children",
    foreignKey: "parentId"
});
SubBrands.belongsTo(SubBrands, {
    as: "parent"
});
// Parent relation
Chain.hasMany(Chain, {
    as: "children",
    foreignKey: "parentId"
});
Chain.belongsTo(Chain, {
    as: "parent"
});
// Parent relation
Channel.hasMany(Channel, {
    as: "children",
    foreignKey: "parentId"
});
Channel.belongsTo(Channel, {
    as: "parent"
});

Chain.hasMany(Pos, {
    foreignKey: 'chainId'
});
Pos.belongsTo(Chain, {
    foreignKey: 'chainId'
});
Chain.hasMany(Pos, {
    foreignKey: 'subChainId',
    as: "subchain"
});
Pos.belongsTo(Chain, {
    foreignKey: 'subChainId',
    as: "subchain"
});

Channel.hasMany(Pos, {
    foreignKey: 'channelId'
});
Pos.belongsTo(Channel, {
    foreignKey: 'channelId'
});
Channel.hasMany(Pos, {
    foreignKey: 'subChannelId',
    as: "subchannel"
});
Pos.belongsTo(Channel, {
    foreignKey: 'subChannelId',
    as: "subchannel"
});
Geography.hasMany(Pos, {
    foreignKey: 'geographyId',
});
Pos.belongsTo(Geography, {
    foreignKey: 'geographyId',
});

Zone.hasMany(Pos, {
    foreignKey: 'zoneId',
});
Pos.belongsTo(Zone, {
    foreignKey: 'zoneId',
});
Zone.hasMany(Route, {
    foreignKey: 'zoneId',
});
Route.belongsTo(Zone, {
    foreignKey: 'zoneId',
});
Geography.hasMany(Route, {
    foreignKey: 'geographyId',
});
Route.belongsTo(Geography, {
    foreignKey: 'geographyId',
});

Brand.belongsToMany(Zone, { through: BrandZones });
Zone.belongsToMany(Brand, { through: BrandZones });

Brand.hasMany(BrandZones, {
    foreignKey: 'brandId',
});
BrandZones.belongsTo(Brand, {
    foreignKey: 'brandId',
});

Assortment.hasMany(AssortmentPos, {
    foreignKey: 'assortmentId',
});
AssortmentPos.belongsTo(Assortment, {
    foreignKey: 'assortmentId',
});
Pos.hasMany(AssortmentPos, {
    foreignKey: 'posId',
    as: "Pos"
});
AssortmentPos.belongsTo(Pos, {
    foreignKey: 'posId',
    as: "Pos"
});

// Assortment.belongsToMany(Pos, { through: AssortmentPos });
// Pos.belongsToMany(Assortment, { through: AssortmentPos });

Brand.hasMany(Objective, {
    foreignKey: 'brandId'
});
Objective.belongsTo(Brand, {
    foreignKey: 'brandId'
});

Objective.hasMany(ObjectiveAccomplishmentScales, {
    foreignKey: 'objectiveId'
});
ObjectiveAccomplishmentScales.belongsTo(Objective, {
    foreignKey: 'objectiveId'
});

Objective.hasMany(ObjectivePos, {
    foreignKey: 'objectiveId'
});
ObjectivePos.belongsTo(Objective, {
    foreignKey: 'objectiveId'
});

Pos.hasMany(ObjectivePos, {
    foreignKey: 'posId'
});
ObjectivePos.belongsTo(Pos, {
    foreignKey: 'posId'
});

Objective.hasMany(ObjectiveRoutes, {
    foreignKey: 'objectiveId'
});
ObjectiveRoutes.belongsTo(Objective, {
    foreignKey: 'objectiveId'
});

Route.hasMany(ObjectiveRoutes, {
    foreignKey: 'routeId'
});
ObjectiveRoutes.belongsTo(Route, {
    foreignKey: 'routeId'
});

Brand.hasMany(Chain, {
    foreignKey: 'brandId'
});
Chain.belongsTo(Brand, {
    foreignKey: 'brandId'
});

Brand.hasMany(Channel, {
    foreignKey: 'brandId'
});
Channel.belongsTo(Brand, {
    foreignKey: 'brandId'
});

Zone.belongsToMany(Geography, { through: ZoneGeography });
Geography.belongsToMany(Zone, { through: ZoneGeography });

Geography.hasMany(ZoneGeography, {
    foreignKey: 'geographyId',
});
ZoneGeography.belongsTo(Geography, {
    foreignKey: 'geographyId',
});

Assortment.belongsToMany(Product, { through: AssortmentProduct });
Product.belongsToMany(Assortment, { through: AssortmentProduct });

User.hasMany(ExpenseKilometer, {
    foreignKey: 'userId'
});
ExpenseKilometer.belongsTo(User, {
    foreignKey: 'userId'
});
Route.hasMany(ExpenseKilometer, {
    foreignKey: 'routeId'
});
ExpenseKilometer.belongsTo(Route, {
    foreignKey: 'routeId'
});
ExpenseType.hasMany(ExpenseKilometer, {
    foreignKey: 'expenseTypeId'
});
ExpenseKilometer.belongsTo(ExpenseType, {
    foreignKey: 'expenseTypeId'
});
User.hasMany(ExpenseKilometer, {
    foreignKey: 'approverId',
    as: "approver"
});
ExpenseKilometer.belongsTo(User, {
    foreignKey: 'approverId',
    as: "approver"
});
ExpenseKilometer.belongsTo(Static, {
    foreignKey: 'startPhotoId',
    as: "startPhoto"
});
Static.hasOne(ExpenseKilometer, {
    foreignKey: 'startPhotoId',
    as: "startPhoto"
});
ExpenseKilometer.belongsTo(Static, {
    foreignKey: 'endPhotoId',
    as: "endPhoto"
});
Static.hasOne(ExpenseKilometer, {
    foreignKey: 'endPhotoId',
    as: "endPhoto"
});

User.hasMany(ExpenseOther, {
    foreignKey: 'userId'
});
ExpenseOther.belongsTo(User, {
    foreignKey: 'userId'
});
Route.hasMany(ExpenseOther, {
    foreignKey: 'routeId'
});
ExpenseOther.belongsTo(Route, {
    foreignKey: 'routeId'
});
ExpenseType.hasMany(ExpenseOther, {
    foreignKey: 'expenseTypeId'
});
ExpenseOther.belongsTo(ExpenseType, {
    foreignKey: 'expenseTypeId'
});
User.hasMany(ExpenseOther, {
    foreignKey: 'approverId',
    as: "otherapprover"
});
ExpenseOther.belongsTo(User, {
    foreignKey: 'approverId',
    as: "otherapprover"
});
ExpenseOther.belongsTo(Static, {
    foreignKey: 'document',
});
Static.hasOne(ExpenseOther, {
    foreignKey: 'document',
});

User.hasMany(Liquidation, {
    foreignKey: 'userId'
});
Liquidation.belongsTo(User, {
    foreignKey: 'userId'
});
User.hasMany(Liquidation, {
    foreignKey: 'approverId',
    as: "lqapprover"
});
Liquidation.belongsTo(User, {
    foreignKey: 'approverId',
    as: "lqapprover"
});
Liquidation.belongsTo(Static, {
    foreignKey: 'attachment_document',
    as: "lqdocument"
});
Static.hasOne(Liquidation, {
    foreignKey: 'attachment_document',
    as: "lqdocument"
});
Liquidation.belongsTo(Static, {
    foreignKey: 'responsable_sign_document',
    as: "responsabledocument"
});
Static.hasOne(Liquidation, {
    foreignKey: 'responsable_sign_document',
    as: "responsabledocument"
});

/********** HOLIDAYS **********/
User.hasMany(Holiday, {
    foreignKey: 'userId'
});
Holiday.belongsTo(User, {
    foreignKey: 'userId'
});
User.hasMany(Holiday, {
    foreignKey: 'approverId',
    as: "hdapprover"
});
Holiday.belongsTo(User, {
    foreignKey: 'approverId',
    as: "hdapprover"
});
Holiday.hasMany(Holidaypublic, {
    foreignKey: 'holidayId'
});
Holidaypublic.belongsTo(Holiday, {
    foreignKey: 'holidayId'
});

/********** LEAVES **********/
User.hasMany(Leave, {
    foreignKey: 'userId'
});
Leave.belongsTo(User, {
    foreignKey: 'userId'
});
User.hasMany(Leave, {
    foreignKey: 'approverId',
    as: "leaveapprover"
});
Leave.belongsTo(User, {
    foreignKey: 'approverId',
    as: "leaveapprover"
});
Leave.belongsTo(Static, {
    foreignKey: 'documentId',
    as: "leavedocument"
});
Static.hasOne(Leave, {
    foreignKey: 'documentId',
    as: "leavedocument"
});
Leave.hasMany(Leavepublic, {
    foreignKey: 'leaveId'
});
Leavepublic.belongsTo(Leave, {
    foreignKey: 'leaveId'
});

/********** WORKDAY **********/
User.hasMany(Workday, {
    foreignKey: 'userId'
});
Workday.belongsTo(User, {
    foreignKey: 'userId'
});

/********** Emaillogs **********/
User.hasMany(Emaillogs, {
    foreignKey: 'userId'
});
Emaillogs.belongsTo(User, {
    foreignKey: 'userId'
});

/********** UsersProjects **********/
User.belongsToMany(Brand, { through: UsersProjects });
Brand.belongsToMany(User, { through: UsersProjects });

/********** Users Company **********/
Company.hasMany(User, {
    foreignKey: 'companyCode'
});
User.belongsTo(Company, {
    foreignKey: 'companyCode'
});

/********** Staticpendingholidays **********/
User.hasMany(Staticpendingholidays, {
    foreignKey: 'userId'
});
Staticpendingholidays.belongsTo(User, {
    foreignKey: 'userId'
});

/********** Holidaystaticdays **********/
Company.hasMany(Holidaystaticdays, {
    foreignKey: 'companyId'
});
Holidaystaticdays.belongsTo(Company, {
    foreignKey: 'companyId'
});

/********** Holidaypaiddayslimit **********/
Company.hasMany(Holidaypaiddayslimit, {
    foreignKey: 'companyId'
});
Holidaypaiddayslimit.belongsTo(Company, {
    foreignKey: 'companyId'
});

/********** Postaglabel **********/
Brand.hasMany(Postaglabel, {
    foreignKey: 'brandId'
});
Postaglabel.belongsTo(Brand, {
    foreignKey: 'brandId'
});
Pos.belongsToMany(Postaglabel, {
    through: Postags,
    foreignKey: 'posId',
    otherKey: 'labelId'
});
Postaglabel.belongsToMany(Pos, {
    through: Postags,
    foreignKey: 'labelId',
    otherKey: 'posId'
});
Pos.belongsToMany(Brand, {
    through: Posbrands,
    foreignKey: 'posId',
    otherKey: 'brandId'
});
Brand.belongsToMany(Pos, {
    through: Posbrands,
    foreignKey: 'brandId',
    otherKey: 'posId'
});
Brand.hasMany(Posbrands, {
    foreignKey: 'brandId'
});
Posbrands.belongsTo(Brand, {
    foreignKey: 'brandId'
});
Pos.hasMany(Posbrands, {
    foreignKey: 'posId'
});
Posbrands.belongsTo(Pos, {
    foreignKey: 'posId'
});

/********** WorksessionAdditionalPOS **********/
User.hasMany(Worksessionadditionalpos, {
    foreignKey: 'userId'
});
Worksessionadditionalpos.belongsTo(User, {
    foreignKey: 'userId'
});
Route.hasMany(Worksessionadditionalpos, {
    foreignKey: 'routeId'
});
Worksessionadditionalpos.belongsTo(Route, {
    foreignKey: 'routeId'
});
Pos.hasMany(Worksessionadditionalpos, {
    foreignKey: 'posId'
});
Worksessionadditionalpos.belongsTo(Pos, {
    foreignKey: 'posId'
});
Brand.hasMany(Worksessionadditionalpos, {
    foreignKey: 'brandId'
});
Worksessionadditionalpos.belongsTo(Brand, {
    foreignKey: 'brandId'
});

/********** Worksessionposbrand **********/
Brand.belongsToMany(WorksessionPos, {
    through: Worksessionposbrand,
    foreignKey: 'brandId',
    otherKey: 'worksessionPosId'
});
WorksessionPos.belongsToMany(Brand, {
    through: Worksessionposbrand,
    foreignKey: 'worksessionPosId',
    otherKey: 'brandId'
});
WorksessionPos.hasMany(Worksessionposbrand, {
    foreignKey: 'worksessionPosId'
});
Worksessionposbrand.belongsTo(WorksessionPos, {
    foreignKey: 'worksessionPosId'
});
Brand.hasMany(Worksessionposbrand, {
    foreignKey: 'brandId'
});
Worksessionposbrand.belongsTo(Brand, {
    foreignKey: 'brandId'
});

/********** BrandOnePage **********/
Brand.hasMany(BrandOnePage, {
    foreignKey: 'brandId'
});
BrandOnePage.belongsTo(Brand, {
    foreignKey: 'brandId'
});
Static.hasMany(BrandOnePage, {
    foreignKey: 'pdfFile',
    as: "onepagePdfFile"
});
BrandOnePage.belongsTo(Static, {
    foreignKey: 'pdfFile',
    as: "onepagePdfFile"
});
BrandOnePage.hasMany(BrandOnepagePos, {
    foreignKey: 'brandOnePageId'
});
BrandOnepagePos.belongsTo(BrandOnePage, {
    foreignKey: 'brandOnePageId'
});
Pos.hasMany(BrandOnepagePos, {
    foreignKey: 'posId'
});
BrandOnepagePos.belongsTo(Pos, {
    foreignKey: 'posId'
});

/********** BrandPromos **********/
Brand.hasMany(BrandPromos, {
    foreignKey: 'brandId'
});
BrandPromos.belongsTo(Brand, {
    foreignKey: 'brandId'
});
Static.hasMany(BrandPromos, {
    foreignKey: 'pdfFile',
    as: "promosPdfFile"
});
BrandPromos.belongsTo(Static, {
    foreignKey: 'pdfFile',
    as: "promosPdfFile"
});
BrandPromos.hasMany(BrandPromosPos, {
    foreignKey: 'brandPromosId'
});
BrandPromosPos.belongsTo(BrandPromos, {
    foreignKey: 'brandPromosId'
});
Pos.hasMany(BrandPromosPos, {
    foreignKey: 'posId'
});
BrandPromosPos.belongsTo(Pos, {
    foreignKey: 'posId'
});

/********** RoutePosInactive **********/
User.hasMany(RoutePosInactive, {
    foreignKey: 'userId'
});
RoutePosInactive.belongsTo(User, {
    foreignKey: 'userId'
});
User.hasMany(RoutePosInactive, {
    foreignKey: 'responsableId',
    as: "responsableUser"
});
RoutePosInactive.belongsTo(User, {
    foreignKey: 'responsableId',
    as: "responsableUser"
});
User.hasMany(RoutePosInactive, {
    foreignKey: 'adminId',
    as: "adminUser"
});
RoutePosInactive.belongsTo(User, {
    foreignKey: 'adminId',
    as: "adminUser"
});
Route.hasMany(RoutePosInactive, {
    foreignKey: 'routeId'
});
RoutePosInactive.belongsTo(Route, {
    foreignKey: 'routeId'
});
Pos.hasMany(RoutePosInactive, {
    foreignKey: 'posId'
});
RoutePosInactive.belongsTo(Pos, {
    foreignKey: 'posId'
});
Static.hasMany(RoutePosInactive, {
    foreignKey: 'photoId',
    as: "inactivePhoto"
});
RoutePosInactive.belongsTo(Static, {
    foreignKey: 'photoId',
    as: "inactivePhoto"
});
Brand.belongsToMany(RoutePosInactive, {
    through: RoutePosInactiveBrands,
    foreignKey: 'brandId',
    otherKey: 'routePosInactiveId'
});
RoutePosInactive.belongsToMany(Brand, {
    through: RoutePosInactiveBrands,
    foreignKey: 'routePosInactiveId',
    otherKey: 'brandId'
});

Static.hasMany(Pos, {
    foreignKey: 'photoId',
    as: "posPhotoFile"
});
Pos.belongsTo(Static, {
    foreignKey: 'photoId',
    as: "posPhotoFile"
});

/********** RoutePosRequestVisitday **********/
User.hasMany(RoutePosRequestVisitday, {
    foreignKey: 'userId'
});
RoutePosRequestVisitday.belongsTo(User, {
    foreignKey: 'userId'
});
User.hasMany(RoutePosRequestVisitday, {
    foreignKey: 'responsableId',
    as: "responsableRVUser"
});
RoutePosRequestVisitday.belongsTo(User, {
    foreignKey: 'responsableId',
    as: "responsableRVUser"
});
User.hasMany(RoutePosRequestVisitday, {
    foreignKey: 'adminId',
    as: "adminRVUser"
});
RoutePosRequestVisitday.belongsTo(User, {
    foreignKey: 'adminId',
    as: "adminRVUser"
});
Route.hasMany(RoutePosRequestVisitday, {
    foreignKey: 'routeId'
});
RoutePosRequestVisitday.belongsTo(Route, {
    foreignKey: 'routeId'
});
Pos.hasMany(RoutePosRequestVisitday, {
    foreignKey: 'posId'
});
RoutePosRequestVisitday.belongsTo(Pos, {
    foreignKey: 'posId'
});
Brand.belongsToMany(RoutePosRequestVisitday, {
    through: RoutePosRequestVisitdayBrands,
    foreignKey: 'brandId',
    otherKey: 'routePosRequestVisitdayId'
});
RoutePosRequestVisitday.belongsToMany(Brand, {
    through: RoutePosRequestVisitdayBrands,
    foreignKey: 'routePosRequestVisitdayId',
    otherKey: 'brandId'
});

/********** PosNewRequest **********/
User.hasMany(PosNewRequest, {
    foreignKey: 'userId'
});
PosNewRequest.belongsTo(User, {
    foreignKey: 'userId'
});
User.hasMany(PosNewRequest, {
    foreignKey: 'responsableId',
    as: "responsablePNRUser"
});
PosNewRequest.belongsTo(User, {
    foreignKey: 'responsableId',
    as: "responsablePNRUser"
});
User.hasMany(PosNewRequest, {
    foreignKey: 'adminId',
    as: "adminPNRUser"
});
PosNewRequest.belongsTo(User, {
    foreignKey: 'adminId',
    as: "adminPNRUser"
});
Route.hasMany(PosNewRequest, {
    foreignKey: 'routeId'
});
PosNewRequest.belongsTo(Route, {
    foreignKey: 'routeId'
});
Pos.hasMany(PosNewRequest, {
    foreignKey: 'posId'
});
PosNewRequest.belongsTo(Pos, {
    foreignKey: 'posId'
});
Brand.belongsToMany(PosNewRequest, {
    through: PosNewRequestBrands,
    foreignKey: 'brandId',
    otherKey: 'posNewRequestedId'
});
PosNewRequest.belongsToMany(Brand, {
    through: PosNewRequestBrands,
    foreignKey: 'posNewRequestedId',
    otherKey: 'brandId'
});

/********** PosAttachment **********/
Static.belongsToMany(Pos, {
    through: PosAttachment,
    foreignKey: 'attachmentId',
    otherKey: 'posId',
    as: "posAttachments"
});
Pos.belongsToMany(Static, {
    through: PosAttachment,
    foreignKey: 'posId',
    otherKey: 'attachmentId',
    as: "posAttachments"
});

module.exports = {
    formatJSON,
    Sequelize,
    sequelize,
    Supervisor,
    Survey,
    User,
    Pos,
    Route,
    RoutePos,
    RouteUser,
    Worksession,
    WorksessionPos,
    WorksessionSurvey,
    WorksessionSurveyResponse,
    Operator,
    OperatorBrand,
    Brand,
    Product,
    Static,
    Family,
    SurveyQuestion,
    SurveyQuestionType,
    SurveyComponent,
    SurveyComponentProducts,
    Geography,
    Products_sub_brands,
    Products_sub_families,
    Assortment,
    Pro_sub_brands,
    Pro_sub_families,
    SubBrands,
    Chain,
    Channel,
    Zone,
    BrandZones,
    AssortmentPos,
    Objective,
    ObjectiveAccomplishmentScales,
    ObjectivePos,
    ObjectiveRoutes,
    ZoneGeography,
    AssortmentProduct,
    ExpenseType,
    ExpenseKilometer,
    ExpenseOther,
    Liquidation,
    Holiday,
    Holidaypublic,
    Leave,
    Leavepublic,
    Workday,
    Emaillogs,
    UsersProjects,
    Company,
    Staticpendingholidays,
    Holidaystaticdays,
    Holidaypaiddayslimit,
    Postaglabel,
    Postags,
    Posbrands,
    Worksessionadditionalpos,
    RoutePosSurvey,
    Worksessionposbrand,
    BrandOnePage,
    BrandOnepagePos,
    BrandPromos,
    BrandPromosPos,
    RoutePosInactive,
    RoutePosInactiveBrands,
    RoutePosRequestVisitday,
    RoutePosRequestVisitdayBrands,
    PosAttachment,
    PosNewRequest,
    PosNewRequestBrands,
}